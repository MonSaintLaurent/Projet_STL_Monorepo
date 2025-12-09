import { Spinner } from "@heroui/spinner";

export default function LoadingPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Spinner style={{ width: 96, height: 96 }} />
    </div>
  );
}
