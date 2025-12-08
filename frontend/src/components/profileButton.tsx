import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";

export default function ProfileButton() {
    const { user, isLoading } = useAuth0();
    const navigate = useNavigate();

    if (isLoading || !user) {
        return null;
    }

    return (
        <Button
            variant="light"
            onPress={() => navigate("/profile")}
            className="flex items-center gap-2"
        >
        <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
        />
        <span>{user.name}</span>
        </Button>
    );
}