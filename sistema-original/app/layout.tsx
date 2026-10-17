import type {Metadata} from 'next';
export const metadata: Metadata = {title:'SilSec | Estudos de tráfego',description:'Estudos privados de tráfego em elevadores, cadastros de clientes e relatórios personalizados.',robots:{index:false,follow:false}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>;}
