const GalleryTabs = ({ categories, activeCategory, onSelect }) => (
  <div className="gallery-tabs" role="tablist" aria-label="Gallery categories">
    {categories.map((category) => (
      <button
        key={category}
        type="button"
        role="tab"
        aria-selected={activeCategory === category}
        className={`gallery-tab ${activeCategory === category ? "active" : ""}`}
        onClick={() => onSelect(category)}
      >
        {category}
      </button>
    ))}
  </div>
);

export default GalleryTabs;
