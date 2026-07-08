export function SeedDataButton() {
  const seedData = async () => {
    try {
      const response = await fetch("/api/admin/seed", { method: "POST" });
      if (response.ok) {
        alert("Database seeded! Please refresh to see changes.");
      } else {
        alert("Failed to seed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error seeding.");
    }
  };

  return (
    <button
      onClick={seedData}
      className="fixed bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-full shadow-lg z-50 text-xs font-bold"
    >
      Seed Data
    </button>
  );
}
