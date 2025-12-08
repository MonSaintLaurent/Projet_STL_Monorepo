import DefaultLayout from "@/layouts/default";
import DefisSection from "@/components/defisSection";
import "@/styles/games.css";

export default function GamesPage() {
  return (
    <DefaultLayout>
      <section className="games-page">
        
        {/* Section défi, reprise du component */}
        <DefisSection />

        {/* Message d'autres défis */}
        <div className="coming-soon">
          <p className="coming-soon-text">D'autres défis arrivent ! 🔥</p>
        </div>

      </section>
    </DefaultLayout>
  );
}