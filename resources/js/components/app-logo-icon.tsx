import logoUrl from '../../images/eaval.png';

export default function AppLogoIcon({ className }: { className?: string }) {
    return <img src={logoUrl} alt="e-Aval" className={className} />;
}
