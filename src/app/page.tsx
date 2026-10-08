import Header from '@/components/layout/Header';
import HeroSection from '@/components/home/HeroSection';
import AcademicLevelGrid from '@/components/home/AcademicLevelGrid';
import FeaturedCoursesSection from '@/components/home/FeaturedCoursesSection';
import TutorialShowcaseSection from '@/components/home/TutorialShowcaseSection';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />
      <main className="flex-1 pt-20">
        <HeroSection />
        <AcademicLevelGrid />
        <FeaturedCoursesSection />
        <TutorialShowcaseSection />
      </main>
      <Footer />
    </div>
  );
}
