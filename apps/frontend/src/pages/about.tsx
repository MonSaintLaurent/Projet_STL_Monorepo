import { title } from "@/components/primitives";

import DefaultLayout from "@/layouts/default";
import "@/styles/about.css";

export default function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: "Richard Martin",
      description: "Étudiant finissant à la fois au sein de l'ETS Montréal et de l'École Polytechnique Universitaire de Montpellier en France, il effectue son projet de fin de maîtrise actuellement sur la maquette ici présente (à enlever j'imagine)",
      image: "/src/images/equipe/avatar.png"
    },
    {
      id: 2,
      name: "Alexandra Nemery",
      title: "Professeure agrégée à l'École de technologie supérieure (ÉTS) à Montréal.",
      description: "Elle travaille dans le domaine de l'expérience utilisateur (logiciel, mobile, web, moteur de jeu) depuis 2009 et c'est spécialisée dans l'UX pour les jeux vidéo dans les dernières années en travaillant pour Ubisoft, Square Enix Montréal et Sony Playstation.",
      image: "/src/images/equipe/avatar.png"
    },
    {
      id: 3,
      name: "Damien Pham Van Bang",
      description: "Le professeur Damien Pham Van Bang est spécialiste en génie côtier et travaille sur les risques d'érosion et de submersion côtières qui peuvent être exacerbés par les changements climatiques, la montée du niveau moyen de la mer et la violence des tempêtes météomarines.",
      image: "/src/images/equipe/avatar.png"
    },
    {
      id: 4,
      name: "Abdelkader Hammouti",
      title: "Chercheur associé à l'École de Technologie Supérieure (ETS).",
      description: "Expertise : Fluid Mechanics, Applied Mathematics and Numerical Analysis, Multiphase Flows, High-Performance Computing",
      image: "/src/images/equipe/avatar.png"
    }
  ];

  return (
    <DefaultLayout>
      <section className="about-page">
        
        <div className="about-title-section">
          <h1 className="about-title-badge">QUI SOMMES NOUS ?</h1>
        </div>

        {/* Description principale */}
        <div className="about-description">
          <p className="about-text">
            Le fleuve Saint-Laurent est crucial pour le commerce canadien, avec plus de 8000 navires transportant plus de 110 millions 
            de tonnes de marchandises et 5 millions de personnes chaque année. Ce trafic devrait augmenter en raison de la 
            croissance économique et des accords commerciaux, le transport fluvial étant plus respectueux de l'environnement que 
            d'autres modes. Cependant, les prévisions de trafic et les changements climatiques pourraient affecter la sécurité, 
            l'économie et l'écologie de la région. Pour une gestion intégrée de cette voie d'eau, il est essentiel de créer une plateforme 
            fédérative en ligne qui regroupe des indicateurs économiques, écologiques et sociétaux. Ce projet vise à développer un 
            outil basé sur des jumeaux numériques pour optimiser la navigation, en mettant l'accent sur l'hydrodynamique et le trafic en 
            temps réel, tout en rendant l'interface utilisateur plus intuitive grâce à des éléments de gamification.
          </p>
        </div>

        {/* Liste membres de l'équipe */}
        <div className="team-section">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-member">
              <div className="member-photo-wrapper">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="member-photo"
                />
              </div>
              
              <div className="member-info">
                <h2 className="member-name">{member.name}</h2>
                <p className="member-title">{member.title}</p>
                {member.description && (
                  <p className="member-description">{member.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </section>
    </DefaultLayout>
  );
}