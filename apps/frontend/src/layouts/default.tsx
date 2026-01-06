import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";

export default function DefaultLayout({
  children,
  fullScreen = false,
}: {
  children: React.ReactNode;
  fullScreen?: boolean;
}) {
  return (
    <div className="relative flex flex-col h-screen w-full">
      <Navbar />

      <main
        className={
          fullScreen
            ? "flex-grow relative overflow-hidden w-full"
            : "container mx-auto max-w-7xl px-6 flex-grow pt-16"
        }
      >
        {children}
      </main>

      {!fullScreen && <Footer />}
    </div>
  );
}
