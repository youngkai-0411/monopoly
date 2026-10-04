const paths = {
  home:'M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7',
  cards:'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  log:'M5 5h14M5 12h14M5 19h14',
  follow:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',
  overview:'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
  close:'M6 6l12 12M18 6 6 18',
  settings:'M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  lock:'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',
  ticket:'M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 7v2M15 11v2M15 15v2',
  trophy:'M7 3h10v7a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 15v5M7 21h10',
  phone:'M7 2h10v20H7zM10 18h4M3 7v5M3 12l-2-2M3 12l2-2M21 17v-5M21 12l-2 2M21 12l2 2',
  train:'M6 3h12v14H6zM6 8h12M9 17l-3 4M15 17l3 4M9 13h.01M15 13h.01',
  palm:'M12 9v12M9 21h6M12 9Q5 0 2 9M12 9Q9 0 14 2M12 9Q19 0 22 9M12 9Q3 5 4 14M12 9q9-4 8 5',
  lantern:'M12 2v3M7 5h10M5 8q7-6 14 0v8q-7 6-14 0zM8 20h8M12 20v2M9 7v11M15 7v11',
  arrow:'M4 12h16M14 6l6 6-6 6',
} as const;
export type GameIconName = keyof typeof paths;
export function GameIcon({name,className=''}:{name:GameIconName;className?:string}) {
  return <svg className={'game-icon '+className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
