export type Locale = 'fr' | 'en';

export interface NavItem {
    key: string;
    href: string;
}

export interface Pillar {
    key: 'simplicity' | 'impact' | 'aesthetics';
    icon: string;
}
