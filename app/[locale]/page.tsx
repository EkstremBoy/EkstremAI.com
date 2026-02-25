import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import VisionSection from '@/components/sections/VisionSection';
import ContactSection from '@/components/sections/ContactSection';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    await params;
    return (
        <main className="relative">
            <Navbar />
            <HeroSection />
            <ProjectsSection />
            <VisionSection />
            <ContactSection />
            <Footer />
        </main>
    );
}
