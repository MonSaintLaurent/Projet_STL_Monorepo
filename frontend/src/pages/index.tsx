import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import DefisSection from "@/components/defisSection";
import ProjectsSection from "@/components/projectsSection";
import "@/styles/index.css";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="index-page">
        
        {/* Section défis */}
        <DefisSection />

        <div style={{ marginTop: "6rem" }} />

        {/* Section projets, recherche gérée dans component defisSection */}
        <ProjectsSection showSearch={true} />

      </section>
    </DefaultLayout>
  );
}