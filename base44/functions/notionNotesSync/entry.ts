import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
const NOTION_API = 'https://api.notion.com/v1';

// Fetch database pages from Notion
async function queryNotionDatabase(databaseId) {
  const response = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 100 }),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.statusText}`);
  }

  return response.json();
}

// Extract text content from Notion block
async function getPageContent(pageId) {
  const response = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    },
  });

  const data = await response.json();
  let content = '';

  for (const block of data.results) {
    if (block.type === 'paragraph' && block.paragraph.rich_text.length) {
      content += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n';
    } else if (block.type === 'heading_1' && block.heading_1.rich_text.length) {
      content += '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n';
    } else if (block.type === 'heading_2' && block.heading_2.rich_text.length) {
      content += '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n';
    } else if (block.type === 'bulleted_list_item') {
      content += '- ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
    }
  }

  return content.trim();
}

// Extract properties from Notion page
function extractPageProperties(page) {
  const props = page.properties;
  const extracted = {
    title: '',
    subject: '',
    source_type: 'notion',
    youtube_url: '',
    pdf_url: '',
  };

  // Get title
  if (props.Name && props.Name.title) {
    extracted.title = props.Name.title.map(t => t.plain_text).join('');
  } else if (props.Title && props.Title.title) {
    extracted.title = props.Title.title.map(t => t.plain_text).join('');
  }

  // Get subject
  if (props.Subject && props.Subject.select) {
    extracted.subject = props.Subject.select.name;
  }

  // Get source URLs
  if (props['YouTube URL'] && props['YouTube URL'].url) {
    extracted.youtube_url = props['YouTube URL'].url;
  }
  if (props['PDF URL'] && props['PDF URL'].url) {
    extracted.pdf_url = props['PDF URL'].url;
  }

  return extracted;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { databaseId } = await req.json();

    if (!databaseId) {
      return Response.json({ error: 'databaseId required' }, { status: 400 });
    }

    // Fetch pages from Notion
    const dbData = await queryNotionDatabase(databaseId);
    const notes = [];

    for (const page of dbData.results) {
      const props = extractPageProperties(page);

      // Skip if no title
      if (!props.title) continue;

      // Get page content
      const content = await getPageContent(page.id);

      // Analyze with LLM if there's YouTube or PDF content mentioned
      let analysisPrompt = '';
      if (props.youtube_url) {
        analysisPrompt = `Analyze these study notes from a YouTube video. Extract key concepts, learning objectives, and important formulas:\n\n${content}`;
      } else if (props.pdf_url) {
        analysisPrompt = `Analyze these study notes from a PDF document. Extract key concepts, learning objectives, and important definitions:\n\n${content}`;
      } else {
        analysisPrompt = `Organize and enhance these study notes by adding structure:\n\n${content}`;
      }

      // Call LLM for analysis
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt + '\n\nProvide structured notes with:\n1. Key Concepts\n2. Learning Objectives\n3. Important Formulas/Definitions\n4. Practice Questions',
      });

      // Map subject to AP subject ID if possible
      let subjectId = 'unknown';
      if (props.subject) {
        const mapping = {
          'Biology': 'ap_biology',
          'Calculus': 'ap_calculus_ab',
          'Chemistry': 'ap_chemistry',
          'Physics': 'ap_physics_1',
          'Psychology': 'ap_psychology',
          'History': 'ap_us_history',
          'Literature': 'ap_english_literature',
          'Language': 'ap_english_language',
        };
        subjectId = mapping[props.subject] || 'unknown';
      }

      // Create study note
      const note = await base44.entities.StudyNote.create({
        user_email: user.email,
        exam_type: 'AP',
        subject_id: subjectId,
        title: props.title,
        content: analysis,
        source_type: props.youtube_url ? 'youtube' : props.pdf_url ? 'upload' : 'notion',
        key_concepts: [],
      });

      notes.push(note);
    }

    return Response.json({
      success: true,
      imported: notes.length,
      notes: notes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});