import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UnitMultiSelect({ 
  selectedSubject, 
  selectedUnits, 
  onUnitsChange 
}) {
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const handleToggleUnit = (unitId) => {
    if (selectedUnits.includes(unitId)) {
      onUnitsChange(selectedUnits.filter(id => id !== unitId));
    } else {
      onUnitsChange([...selectedUnits, unitId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUnits.length === units.length) {
      onUnitsChange([]);
    } else {
      onUnitsChange(units.map(u => u.id));
    }
  };

  if (!selectedSubject) {
    return (
      <div className="text-sm text-white py-4">
        Select a subject first
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-white py-4">
        Loading units...
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-sm text-white py-4">
        No units available for this subject
      </div>
    );
  }

  const sortedUnits = units.sort((a, b) => a.unit_number - b.unit_number);

  return (
    <div className="space-y-3">
      {/* Select All Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
        <span className="text-sm font-medium text-white">
          {selectedUnits.length} of {units.length} units selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="h-8 text-xs"
        >
          {selectedUnits.length === units.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Selected Units Preview */}
      {selectedUnits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedUnits
            .filter(u => selectedUnits.includes(u.id))
            .slice(0, 5)
            .map((unit) => (
              <Badge 
                key={unit.id} 
                variant="secondary"
                className="text-xs pl-2 pr-1"
              >
                Unit {unit.unit_number}
                <button
                  onClick={() => handleToggleUnit(unit.id)}
                  className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          {selectedUnits.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedUnits.length - 5} more
            </Badge>
          )}
        </div>
      )}

      {/* Unit List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {sortedUnits.map((unit) => (
          <label
            key={unit.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              selectedUnits.includes(unit.id)
                ? "border-violet-500 bg-slate-800/40"
                : "border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/20"
            )}
          >
            <Checkbox
              checked={selectedUnits.includes(unit.id)}
              onCheckedChange={() => handleToggleUnit(unit.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                Unit {unit.unit_number}: {unit.unit_name}
              </p>
              {unit.description && (
                <p className="text-xs text-white mt-0.5 line-clamp-2">
                  {unit.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}