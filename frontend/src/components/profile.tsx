import { useAuth0 } from "@auth0/auth0-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  useDisclosure,
} from "@heroui/react";

export default function Profile() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { user, isLoading, logout } = useAuth0();

  return (
    <>
      <Button onPress={onOpen}>Open Drawer</Button>
      <Drawer
        isOpen={isOpen}
        motionProps={{
          variants: {
            enter: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.3 },
            },
            exit: {
              x: 100,
              opacity: 0,
              transition: { duration: 0.3 },
            },
          },
        }}
        onOpenChange={onOpenChange}
      >
        <DrawerContent>
          {(onClose: any) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                Custom Motion Drawer
              </DrawerHeader>
              <DrawerBody>
                {isLoading ? (
                  <p>Loading user info...</p>
                ) : user ? (
                  <div>
                    <p>
                      <strong>Name:</strong> {user.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    {user.picture && (
                      <img
                        alt="User avatar"
                        src={user.picture}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          marginTop: 8,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <p>No user information available.</p>
                )}
              </DrawerBody>
              <DrawerFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    logout();
                    onClose();
                  }}
                >
                  Logout
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
