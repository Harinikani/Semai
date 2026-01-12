export default function StoryPreview() {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm">
      <div className="relative">
        <img
          src="https://shorturl.at/GxmQu"
          alt="Story image"
          className="w-full h-48 object-cover"
        />
        
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <h1 className="text-3xl font-bold text-white p-6">The Colorful Warning</h1>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-gray-700">
          A tiny frog with a big secret. Discover the vibrant world of the poison dart frog.
        </p>
      </div>
    </div>
  );
}