import React from 'react';

/**
 * Wraps a lucide-react icon in the kit's `.ic` span so the design-system CSS
 * (`.ic svg`, `.pf-stat__icon .ic svg`, …) can size and color it by context.
 */
export default function Ic({ icon: Icon, ...rest }) {
  if (!Icon) return null;
  return (
    <span className="ic" aria-hidden="true">
      <Icon {...rest} />
    </span>
  );
}
