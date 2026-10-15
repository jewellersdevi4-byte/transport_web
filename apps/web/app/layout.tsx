import type {Metadata} from 'next';
import '../../../packages/shared-ui/src/styles.css';
export const metadata:Metadata={title:'Miles & Moments — Travel, your way',description:'Comfortable private rides, transparent fares, and trusted drivers. Book directly on the web.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
