import React, { useState } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Inbox,
  Activity,
  CreditCard,
  Globe,
  Terminal,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const mockNavGroups: NavGroupData[] = [
  {
    items: [
      { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
      { id: 'ai-assistant', title: 'AI Assistant', icon: LayoutDashboard, path: '/ai-assistant' },
      { id: 'datasets', title: 'Datasets', icon: Inbox, path: '/datasets', badge: 'Pro' },
      { id: 'datamart', title: 'DataMart', icon: Activity, path: '/datamart' },
    ]
  },
  {
    heading: 'Enterprise Workspace',
    items: [
      { 
        id: 'projects', 
        title: 'DataMart Studio', 
        icon: FolderKanban,
        children: [
          { id: 'dm-query', title: 'Query Builder', icon: Hash, path: '/datamart/query' },
          { id: 'dm-analyses', title: 'Analysis', icon: Hash, path: '/datamart/analyses' },
          { id: 'dm-dashboards', title: 'Dashboards', icon: Hash, path: '/datamart/dashboards' },
          { id: 'dm-metrics', title: 'Metrics Catalog', icon: Hash, path: '/datamart/metrics' },
        ]
      },
      { id: 'knowledge-base', title: 'Knowledge Base', icon: Globe, path: '/knowledge-base' },
      { 
        id: 'backtesting-group', 
        title: 'Backtesting', 
        icon: Terminal,
        children: [
          { id: 'bt-overview', title: 'Strategy Overview', icon: Hash, path: '/backtesting' },
          { id: 'bt-new', title: 'New Backtest', icon: Hash, path: '/backtesting/new' },
        ]
      },
      { id: 'reports', title: 'Reports & Export', icon: CreditCard, path: '/reports' },
    ]
  },
  {
    heading: 'Developers & Data',
    items: [
      { id: 'upload-center', title: 'Upload Center', icon: Blocks, path: '/upload-center' },
      { id: 'settings', title: 'Settings & Health', icon: Settings, shortcut: '⌘,', path: '/settings' },
    ]
  }
];

const mockBottomItems: NavItemData[] = [
  { id: 'logout', title: 'Log out', icon: LogOut, path: '/signin' },
];

function WorkspaceSwitcher({
  selected,
  onSelect,
  collapsed = false,
}: {
  selected?: string;
  onSelect?: (ws: string) => void;
  collapsed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState('Enterprise Platform');
  
  const current = selected || internalSelected;
  const handleSelect = onSelect || setInternalSelected;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center ${collapsed ? 'justify-center px-1' : 'justify-between px-2.5'} py-1.5 mb-2.5 rounded-lg hover:bg-white/[0.06] cursor-pointer transition-colors select-none group border border-white/[0.08] bg-[#0d0d0d]`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-zinc-100 flex items-center justify-center font-semibold text-[11px] shrink-0 border border-zinc-700/80 shadow-xs">
            {current.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-medium leading-tight text-zinc-100 truncate max-w-[130px]">{current}</span>
              <span className="text-[10px] text-zinc-400 leading-tight">Pro Plan</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" strokeWidth={1.5} />
        )}
      </div>

      {isOpen && !collapsed && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[48px] left-0 w-full bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {['Enterprise Platform', 'Production Analytics', 'Staging Sandbox'].map((ws) => (
              <div 
                key={ws}
                onClick={() => { handleSelect(ws); setIsOpen(false); }}
                className={`px-3 py-1.5 mx-1 text-[11.5px] rounded-md cursor-pointer transition-colors ${current === ws ? 'bg-white/10 text-white font-medium' : 'text-zinc-300 hover:bg-white/[0.05]'}`}
              >
                {ws}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ 
  item, 
  activeId, 
  onSelect,
  collapsed = false,
  level = 0
}: { 
  item: NavItemData; 
  activeId: string; 
  onSelect: (id: string, path?: string) => void;
  collapsed?: boolean;
  level?: number;
}) {
  const isActive = activeId === item.id || (item.path && activeId === item.path);
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    if (hasChildren && !collapsed) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id, item.path);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-2.5'} h-8 rounded-lg cursor-pointer transition-all duration-150 select-none
          ${isActive 
            ? 'bg-white/10 text-white font-medium shadow-xs' 
            : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
          }
        `}
        style={!collapsed ? { paddingLeft: `${level * 10 + 10}px` } : undefined}
        onClick={handleClick}
        title={collapsed ? item.title : undefined}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[15px] h-[15px] transition-colors shrink-0
              ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-100'}
            `} 
            strokeWidth={1.5} 
          />
          {!collapsed && (
            <span className="text-[12px] tracking-tight truncate">
              {item.title}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            {item.shortcut && (
               <kbd className="hidden group-hover:inline-flex items-center justify-center h-4 px-1 text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-700/60 rounded">
                 {item.shortcut}
               </kbd>
            )}
            {item.badge && (
              <span className="flex items-center justify-center min-w-[18px] h-4 px-1 text-[9px] font-semibold rounded-full bg-white/10 text-white">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronRight 
                className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
                strokeWidth={2}
              />
            )}
          </div>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-white/[0.06]"
              style={{ left: `${level * 10 + 17}px` }}
            />
            {item.children!.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                collapsed={collapsed}
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ 
  className = '',
  activeId,
  onSelect,
  activeWorkspace,
  onWorkspaceSelect,
  collapsed = false,
}: { 
  className?: string;
  activeId?: string;
  onSelect?: (id: string, path?: string) => void;
  activeWorkspace?: string;
  onWorkspaceSelect?: (ws: string) => void;
  collapsed?: boolean;
}) {
  const [internalId, setInternalId] = useState('ai-assistant');
  const currentId = activeId !== undefined ? activeId : internalId;
  const handleSelect = onSelect || setInternalId;

  return (
    <div className={`flex flex-col ${collapsed ? 'w-[72px]' : 'w-[280px]'} h-full bg-[#0d0d0d] border-r border-white/[0.06] p-2.5 font-sans transition-all duration-200 ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} collapsed={collapsed} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-2.5 mt-1">
        {mockNavGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && !collapsed && (
              <span className="px-2.5 mb-1 text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activeId={currentId} 
                onSelect={handleSelect} 
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-2 border-t border-white/[0.06] flex flex-col gap-0.5">
        {mockBottomItems.map(item => (
          <NavItem 
            key={item.id} 
            item={item} 
            activeId={currentId} 
            onSelect={handleSelect} 
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

const allItems = [...mockNavGroups.flatMap(g => g.items), ...mockBottomItems];
const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);
};
const flatMockData = flattenItems(allItems);

export default function SidebarNavPreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState('ai-assistant');
  const [activeWorkspace, setActiveWorkspace] = useState('Enterprise Platform');

  const activeItem = flatMockData.find(i => i.id === activeId);
  const activeTitle = activeItem ? activeItem.title : 'Dashboard';

  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[700px] bg-[#0a0a0a] p-4 md:p-8">
      <div className="relative w-full max-w-4xl h-[700px] bg-[#141414] rounded-2xl border border-white/[0.06] flex overflow-hidden shadow-2xl">
        <div 
          className={`h-full transition-all duration-200 ease-in-out shrink-0 overflow-hidden bg-[#0d0d0d] border-r border-white/[0.06] ${
            isOpen ? 'w-[280px] opacity-100' : 'w-[72px] opacity-100'
          }`}
        >
          <SidebarNav 
            className="w-full border-none bg-transparent" 
            activeId={activeId}
            onSelect={handleSelect}
            activeWorkspace={activeWorkspace}
            onWorkspaceSelect={setActiveWorkspace}
            collapsed={!isOpen}
          />
        </div>
        
        <div className="flex-1 bg-[#141414] flex flex-col min-w-0 transition-all duration-200">
           <div className="h-14 border-b border-white/[0.06] flex items-center px-6 justify-between bg-[#111111] shrink-0">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsOpen(!isOpen)}
                 className="p-1.5 rounded-lg text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 transition-colors"
               >
                 {isOpen ? <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} /> : <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />}
               </button>
               <div className="flex items-center gap-2 text-xs text-zinc-400">
                 <span className="truncate">{activeWorkspace}</span>
                 <span>/</span>
                 <span className="font-semibold text-zinc-100 truncate">{activeTitle}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="w-64 h-8 bg-[#181818] rounded-lg border border-white/[0.06] hidden md:block" />
               <div className="w-8 h-8 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-semibold text-white">EP</div>
             </div>
           </div>

           <div className="p-6 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div className="h-32 bg-[#181818] rounded-xl border border-white/[0.06] shadow-sm p-4" />
               <div className="h-32 bg-[#181818] rounded-xl border border-white/[0.06] shadow-sm p-4" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
