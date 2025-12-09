import { useState } from "react";
import { Button } from "@heroui/button";
import projectsData from "@/data/projects.json";

interface ProjectsSectionProps {
  showSearch?: boolean;
}

export default function ProjectsSection({ showSearch = true }: ProjectsSectionProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filtrer les projets en fonction de la recherche
    const filteredProjects = projectsData.filter((project) => {
    const query = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(query) ||
            project.location.toLowerCase().includes(query)
        );
    });

    // Fonction pour clear la recherche
    const clearSearch = () => {
        setSearchQuery("");
    };
  
    return (
    <div className="projects-section">
      <div className="projects-header">
        <h2 className="projects-title">Projets ({filteredProjects.length})</h2>
        {showSearch && (
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-clear" onClick={clearSearch}>×</button>
          </div>
        )}
      </div>

      {/* Grille des projets */}
      <div className="projects-grid">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              {/* Image du projet */}
              <div className="project-image">
                <div>{project.image}</div>
              </div>
              
              {/* Info du projet */}
              <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-location">{project.location}</p>
              </div>
              
              {/* Bouton Lancer */}
              <Button color="primary" 
                className="w-full"
                size="sm"
              >
                Lancer
              </Button>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>Aucun projet trouvé pour "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}