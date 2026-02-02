import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useTelegramAuth } from "../hooks/useTelegramAuth";

export const Route = createFileRoute("/")({
  component: FoodTracker,
});

const MOOD_EMOJIS = {
  great: "🤩",
  good: "😊",
  neutral: "😐",
  bad: "😕",
  terrible: "🤢",
};

function FoodTracker() {
  const { user, isLoading: authLoading } = useTelegramAuth();
  const [foodName, setFoodName] = useState("");
  const [mood, setMood] = useState<"great" | "good" | "neutral" | "bad" | "terrible" | null>(null);
  const [notes, setNotes] = useState("");
  
  const entries = useQuery(
    api.foodEntries.getUserEntries, 
    user?._id ? { userId: user._id as any, limit: 10 } : "skip"
  );
  const createEntry = useMutation(api.foodEntries.createEntry);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !foodName) return;
    
    await createEntry({
      userId: user._id as any,
      foodName,
      mood: mood || undefined,
      notes: notes || undefined,
      timestamp: Date.now(),
    });
    
    setFoodName("");
    setMood(null);
    setNotes("");
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🍽️</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Food Tracker</h1>
          <p className="text-gray-600 mb-6">Track what you eat and how you feel</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Please open this app through Telegram</p>
            <button 
              className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition"
              onClick={() => {
                // Open Telegram Bot link
                window.open("https://t.me/your_bot_username", "_blank");
              }}
            >
              Open in Telegram
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Food Tracker</h1>
          <p className="text-gray-600 mt-1">How did that meal make you feel?</p>
          {user.firstName && (
            <p className="text-sm text-gray-500 mt-2">Hello, {user.firstName}! 👋</p>
          )}
        </div>
        
        {/* Add Entry Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">What did you eat?</label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Pad Thai, Burger, Salad..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">How do you feel?</label>
            <div className="flex justify-between gap-2">
              {(Object.keys(MOOD_EMOJIS) as Array<keyof typeof MOOD_EMOJIS>).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`flex-1 py-3 rounded-xl text-2xl transition ${
                    mood === m 
                      ? "bg-orange-100 ring-2 ring-orange-400" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {MOOD_EMOJIS[m]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any symptoms, energy levels, etc."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition resize-none"
            />
          </div>
          
          <button
            type="submit"
            disabled={!foodName}
            className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Entry
          </button>
        </form>
        
        {/* Recent Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Entries</h2>
          {entries && entries.length > 0 ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{entry.mood ? MOOD_EMOJIS[entry.mood] : "🍽️"}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{entry.foodName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                      {entry.notes && <span className="ml-2 text-gray-400">• {entry.notes}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No entries yet. Start tracking!</p>
          )}
        </div>
      </div>
    </div>
  );
}
