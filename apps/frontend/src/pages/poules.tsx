import {useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import PoulesSection from "@/components/poulesSection";
import InvitationsSection from "@/components/invitationsSection";
import CreatePouleSection from "@/components/createPouleSection";
import PouleDetailSection from "@/components/pouleDetailSection";
import HistoriqueSection from "@/components/historiqueSection";
import "@/styles/poules.css";

type View = "poules" | "invitations" | "create" | "detail" | "historique";

export default function PoulesPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Lire les paramètres URL
    const params = new URLSearchParams(location.search);
    const viewFromUrl = params.get("view") as View | null;
    const pouleIdFromUrl = params.get("poule_id");

    const [currentView, setCurrentView] = useState<View>(viewFromUrl || "poules");
    const [selectedPouleId, setSelectedPouleId] = useState<string | null>(pouleIdFromUrl);

    // Synchroniser avec l'URL
    useEffect(() => {
        if (viewFromUrl) setCurrentView(viewFromUrl);
        if (pouleIdFromUrl) setSelectedPouleId(pouleIdFromUrl);
    }, [viewFromUrl, pouleIdFromUrl]);

    const handleViewPouleDetail = (pouleId: string) => {
        setSelectedPouleId(pouleId);
        setCurrentView("detail");
        // Mettre à jour l'URL
        navigate(`/poules?view=detail&poule_id=${pouleId}`);
    };

    const handleBack = () => {
        setCurrentView("poules");
        setSelectedPouleId(null);
        // Retour à l'URL de base
        navigate("/poules");
    };

    const handleNavigate = (view: View) => {
        setCurrentView(view);
        // Mettre à jour l'URL
        navigate(`/poules?view=${view}`);
    };

    return (
        <DefaultLayout>
            <section className="poules-page">
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