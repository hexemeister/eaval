import logoUrl from '../../images/eaval.webp';

export default function AppLogoIcon({ className }: { className?: string }) {
    return <img src={logoUrl} alt="e-Aval" className={className} />;
}
