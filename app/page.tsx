import MediaApp from "../components/MediaApp";

export const metadata = {
  title: "tblinc v1 - Premium Media Archive",
  description: "Browse and stream premium media.",
};

export default function Home() {
  return (
    <div className="w-full h-full">
      <MediaApp />
    </div>
  );
}
