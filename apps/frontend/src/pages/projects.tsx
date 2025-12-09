import { Button } from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import ProjectsSection from "@/components/projectsSection";
import "@/styles/projects.css";

export default function ProjectsPage() {
  return (
    <DefaultLayout>
      <section className="projects-page">
        
        <ProjectsSection showSearch={true} />

      </section>
    </DefaultLayout>
  );
}