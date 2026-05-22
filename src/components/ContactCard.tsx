import React from 'react';
import { ContactPerson } from '../types';
import { User, Briefcase } from 'lucide-react';

interface ContactCardProps {
  person: ContactPerson;
}

export default function ContactCard({ person }: ContactCardProps) {
  // Generate initials for avatar
  const initials = React.useMemo(() => {
    if (!person.name) return '?';
    const parts = person.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [person.name]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 select-none border border-indigo-200/40 dark:border-indigo-900/30">
        {initials}
      </div>
      
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{person.name}</span>
        </h4>
        
        {person.title && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{person.title}</span>
          </p>
        )}
      </div>
    </div>
  );
}
