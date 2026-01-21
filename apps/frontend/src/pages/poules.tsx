import {useState} from "react";
import DefaultLayout from "@/layouts/default";
import PoulesSection from "@/components/poulesSection";
import InvitationsSection from "@/components/invitationsSection";
import CreatePouleSection from "@/components/createPouleSection";
import PouleDetailSection from "@/components/pouleDetailSection";
import HistoriqueSection from "@/components/historiqueSection";
import "@/styles/poules.css";

type View = "poules" | "invitations" | "create" | "detail" | "historique";

export default function PoulesPage() {
    const [currentView, setCurrentView] = useState<View>("poules");
    const [selectedPouleId, setSelectedPouleId] = useState<string | null>(null);

    const handleViewPouleDetail = (pouleId: string) => {
        setSelectedPouleId(pouleId);
        setCurrentView("detail");
    };

    const handleBack = () => {
        setCurrentView("poules");
        setSelectedPouleId(null);
    };

    const handleNavigate = (view: View) => {
        setCurrentView(view);
    };

    return (
        <DefaultLayout>
            <section className="poules-page">
                {/* Content based on current view */}
                <div className="poules-content">
                    {currentView === "poules" && (
                        <PoulesSection 
                            onViewDetail={handleViewPouleDetail}
                            onNavigate={handleNavigate}
                        />
                    )}
                    {currentView === "invitations" && (
                        <InvitationsSection onBack={handleBack} />
                    )}
                    {currentView === "create" && (
                        <CreatePouleSection onBack={handleBack} />
                    )}
                    {currentView === "detail" && selectedPouleId && (
                        <PouleDetailSection pouleId={selectedPouleId} onBack={handleBack} />
                    )}
                    {currentView === "historique" && (
                        <HistoriqueSection onBack={handleBack} onViewDetail={handleViewPouleDetail} />
                    )}
                </div>
            </section>
        </DefaultLayout>
    );
}