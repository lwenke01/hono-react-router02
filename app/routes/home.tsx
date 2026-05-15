import React, { useState, useEffect } from "react";
import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/home";

// Reuse your existing types / loader
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Collections Admin" },
    { name: "description", content: "Admin for collections and designs" },
  ];
}

export const loader = async ({ request }: { request: Request }) => {
  const origin = new URL(request.url).origin;
  const [collections, designs] = await Promise.all([
    fetch(new URL("/api/collections", origin).toString()).then((r) =>
      r.json(),
    ),
    fetch(new URL("/api/designs", origin).toString()).then((r) => r.json()),
  ]);
  return { collections, designs };
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
});

const emptyDesign = {
  id: null as string | null,
  name: "",
  shape: "",
  measurements: "",
  productInfo: "",
  designId: "",
  price: "",
  categories: [] as string[],
  imageUrls: [] as string[],
  favourite: false,
};

const categoryOptions = [
  "Tote",
  "Satchel",
  "Clutch",
  "Crossbody",
  "Shoulder",
  "Mini",
  "Backpack",
  "Handbag",
  "Wallet",
  "Purse",
  "Accessory",
];

const Home = () => {
  const { collections: initialCollections, designs: initialDesigns } =
    useLoaderData<typeof loader>();

  const [collections, setCollections] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [season, setSeason] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFavourite, setEditingFavourite] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [seasonField, setSeasonField] = useState("");
  const [seriesField, setSeriesField] = useState("");
  const [year, setYear] = useState("");
  const [edition, setEdition] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState("");
  const [pin, setPin] = useState("");
  const [inLookbook, setInLookbook] = useState(false);
  const [categories, setCategories] = useState("");
  const [range, setRange] = useState("");

  // Variations / designs
  const [colors, setColors] = useState("");
  const [sizes, setSizes] = useState("");
  const [version, setVersion] = useState("");
  const [themes, setThemes] = useState("");
  const [designsForm, setDesignsForm] = useState([
    { ...emptyDesign },
  ] as typeof emptyDesign[]);

  useEffect(() => {
    // Normalize your loader response into state
    const cols = Array.isArray(initialCollections)
      ? [...initialCollections].sort(
          (a, b) =>
            new Date(b.releaseDate || 0).getTime() -
            new Date(a.releaseDate || 0).getTime(),
        )
      : [];
    setCollections(cols);

    const ds = Array.isArray(initialDesigns) ? initialDesigns : [];
    setDesigns(ds);
  }, [initialCollections, initialDesigns]);

  // Start editing a collection
  const startEdit = (collection: any) => {
    setEditingId(collection.id);
    setName(collection.name || "");
    setSeasonField(collection.season || "");
    setSeriesField(collection.series || "");
    setYear(collection.year || "");
    setEdition(collection.edition || "");
    setReleaseDate(collection.releaseDate || "");
    setImageUrl(collection.imageUrl || "");
    setDescription(collection.description || "");
    setVideo(collection.video || "");
    setPin(collection.pin || "");
    setInLookbook(collection.inLookbook || false);
    setCategories(
      Array.isArray(collection.categories)
        ? collection.categories.join(", ")
        : "",
    );
    setRange(collection.range || "");

    // Variations
    const variations = collection.variations || {};
    setColors(
      Array.isArray(variations.color)
        ? variations.color.join(", ")
        : "",
    );
    setSizes(
      Array.isArray(variations.size)
        ? variations.size.join(", ")
        : "",
    );
    setVersion(variations.version || "");
    setThemes(
      Array.isArray(variations.theme)
        ? variations.theme.join(", ")
        : "",
    );
    setEditingFavourite(collection.favourite || false);

    // Map designs
    const formDesigns =
      Array.isArray(variations.design) && variations.design.length > 0
        ? variations.design.map((d: any) => ({
            id: d.id || null,
            name: d.name || "",
            designId: d.designId || "",
            shape: d.shape || "",
            measurements: d.measurements || "",
            productInfo: d.productInfo || "",
            price:
              typeof d.price === "number" ? d.price.toString() : "",
            categories: Array.isArray(d.categories)
              ? d.categories
              : [],
            imageUrls: Array.isArray(d.imageUrls)
              ? d.imageUrls
              : [],
            favourite: d.favourite || false,
          }))
        : [{ ...emptyDesign }];

    setDesignsForm(formDesigns);
  };

  const handleAddOrUpdateCollection = async () => {
    if (!name) return alert("Collection name is required");

    const cleanDesigns = designsForm
      .filter(
        (d) =>
          d.name ||
          d.shape ||
          d.measurements ||
          d.productInfo ||
          d.designId ||
          d.price ||
          (Array.isArray(d.categories) && d.categories.length > 0) ||
          (Array.isArray(d.imageUrls) && d.imageUrls.length > 0),
      )
      .map((d) => ({
        id: d.id || undefined,
        name: typeof d.name === "string" ? d.name.trim() : "",
        designId:
          typeof d.designId === "string" ? d.designId.trim() : "",
        shape:
          typeof d.shape === "string" ? d.shape.trim() : "",
        measurements:
          typeof d.measurements === "string"
            ? d.measurements.trim()
            : "",
        productInfo:
          typeof d.productInfo === "string"
            ? d.productInfo.trim()
            : "",
        price: parseFloat(d.price) || 0,
        categories: Array.isArray(d.categories)
          ? d.categories.filter(Boolean)
          : [],
        imageUrls: Array.isArray(d.imageUrls)
          ? d.imageUrls.filter(Boolean)
          : [],
        favourite: d.favourite || false,
      }));

    const variations = {
      color: colors.split(",").map((c) => c.trim()).filter(Boolean),
      size: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      version: version.trim() || null,
      theme: themes.split(",").map((t) => t.trim()).filter(Boolean),
      design: cleanDesigns,
    };

    const collectionData = {
      id: editingId || undefined,
      name,
      season: seasonField.trim(),
      series: seriesField.trim(),
      year: year.trim(),
      edition: edition.trim(),
      releaseDate: releaseDate || null,
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      video: video.trim(),
      pin: pin.trim(),
      inLookbook: inLookbook || false,
      categories: categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      range: range.trim(),
      variations,
      favourite: editingFavourite,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/collections/${editingId}`
        : "/api/collections";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionData),
      });

      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();
      if (editingId) {
        setCollections((prev) =>
          prev.map((c) => (c.id === editingId ? saved : c)),
        );
      } else {
        setCollections((prev) => [saved, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving collection:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingFavourite(false);
    setName("");
    setSeasonField("");
    setSeriesField("");
    setYear("");
    setEdition("");
    setReleaseDate("");
    setImageUrl("");
    setDescription("");
    setVideo("");
    setPin("");
    setInLookbook(false);
    setCategories("");
    setRange("");
    setColors("");
    setSizes("");
    setVersion("");
    setThemes("");
    setDesignsForm([{ ...emptyDesign }]);
  };

  const handleDesignChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    const updated = [...designsForm];
    updated[index][field] = value;
    setDesignsForm(updated);
  };

  const addDesign = () =>
    setDesignsForm((prev) => [...prev, { ...emptyDesign }]);

  const removeDesign = (index: number) =>
    setDesignsForm((prev) => prev.filter((_, i) => i !== index));

  const toggleCollectionFavourite = async (collection: any) => {
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collection,
          favourite: !collection.favourite,
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle favourite");

      const updated = await res.json();
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id ? updated : c,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle favourite:", error);
    }
  };

  const filtered = collections.filter((c) => {
    if (season && c.season !== season) return false;
    if (series && c.series !== series) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const seasons = Array.from(
    new Set(
      collections
        .map((c) => c.season)
        .filter(Boolean),
    ),
  );
  const seriesList = Array.from(
    new Set(
      collections.map((c) => c.series).filter(Boolean),
    ),
  );

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="col-span-1">
          <div className="sticky top-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by season
              </label>
              <select
                value={season ?? ""}
                onChange={(e) =>
                  setSeason(e.target.value || null)
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All seasons</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by series
              </label>
              <select
                value={series ?? ""}
                onChange={(e) =>
                  setSeries(e.target.value || null)
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All series</option>
                {seriesList.map((s: any) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="block w-full rounded border px-3 py-2 text-sm"
              >
                Create new collection
              </button>
            </div>
          </div>
        </aside>

        <section className="col-span-3">
          {editingId ? (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "Edit" : "Add"} Collection
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Season"
                  value={seasonField}
                  onChange={(e) =>
                    setSeasonField(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Series"
                  value={seriesField}
                  onChange={(e) =>
                    setSeriesField(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Edition"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className="rounded border px-3 py-2"
                />
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) =>
                    setReleaseDate(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) =>
                    setImageUrl(e.target.value)
                  }
                  className="w-full rounded border px-3 py-2"
                />
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full rounded border px-3 py-2 mt-2"
                />
                <input
                  placeholder="Video URL"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  className="w-full rounded border px-3 py-2 mt-2"
                />
                <input
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded border px-3 py-2 mt-2"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <input
                  placeholder="Colors (comma separated)"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Sizes (comma separated)"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Version"
                  value={version}
                  onChange={(e) =>
                    setVersion(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Themes (comma separated)"
                  value={themes}
                  onChange={(e) =>
                    setThemes(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Categories (comma separated)"
                  value={categories}
                  onChange={(e) =>
                    setCategories(e.target.value)
                  }
                  className="rounded border px-3 py-2"
                />
                <input
                  placeholder="Range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="rounded border px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm">
                  In Lookbook
                </label>
                <input
                  type="checkbox"
                  checked={inLookbook}
                  onChange={(e) =>
                    setInLookbook(e.target.checked)
                  }
                />
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">
                  Designs
                </h3>
                {designsForm.map((design, index) => (
                  <div
                    key={index}
                    className="border rounded p-3 mb-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Design #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...designsForm];
                          updated[index].favourite =
                            !updated[index].favourite;
                          setDesignsForm(updated);
                        }}
                        className={`text-sm ${
                          design.favourite
                            ? "text-yellow-500"
                            : "text-gray-400"
                        }`}
                      >
                        {design.favourite ? "⭐" : "☆"}
                      </button>
                    </div>

                    <input
                      placeholder="Name"
                      value={design.name}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />
                    <input
                      placeholder="Design ID"
                      value={design.designId}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "designId",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />
                    <input
                      placeholder="Shape"
                      value={design.shape}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "shape",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />
                    <input
                      placeholder="Measurements"
                      value={design.measurements}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "measurements",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />
                    <input
                      placeholder="Product Info"
                      value={design.productInfo}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "productInfo",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={design.price}
                      onChange={(e) =>
                        handleDesignChange(
                          index,
                          "price",
                          e.target.value,
                        )
                      }
                      className="w-full rounded border px-3 py-1 mb-1"
                    />

                    <div className="mb-1">
                      <label className="block text-xs text-gray-600">
                        Categories (comma‑separated or selected)
                      </label>
                      <input
                        placeholder="Categories"
                        value={Array.isArray(design.categories)
                          ? design.categories.join(", ")
                          : ""}
                        onChange={(e) =>
                          handleDesignChange(
                            index,
                            "categories",
                            e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          )
                        }
                        className="w-full rounded border px-3 py-1"
                      />
                    </div>

                    <div className="mb-1">
                      <label className="block text-xs text-gray-600">
                        Image URLs (comma‑separated)
                      </label>
                      <input
                        placeholder="Image URLs"
                        value={Array.isArray(design.imageUrls)
                          ? design.imageUrls.join(", ")
                          : ""}
                        onChange={(e) =>
                          handleDesignChange(
                            index,
                            "imageUrls",
                            e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          )
                        }
                        className="w-full rounded border px-3 py-1"
                      />
                    </div>

                    {designsForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDesign(index)}
                        className="text-sm text-red-600"
                      >
                        Remove Design
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addDesign}
                  className="text-sm text-blue-600"
                >
                  Add Another Design
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddOrUpdateCollection}
                  className="bg-blue-600 text-white rounded px-4 py-2"
                >
                  {editingId
                    ? "Update Collection"
                    : "Add Collection"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-600 rounded px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-6">
                Collections Admin
              </h1>

              <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                  <li className="text-gray-500">
                    No collections found
                  </li>
                ) : (
                  filtered.map((col) => (
                    <li
                      key={col.id}
                      className="border rounded-lg overflow-hidden bg-white shadow-sm"
                    >
                      <div className="flex">
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                          {col.imageUrl ? (
                            <img
                              src={col.imageUrl}
                              alt={col.name}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">
                              No image
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-lg font-semibold">
                                {col.name}
                              </h2>
                              <div className="text-sm text-gray-600">
                                {col.year} | {col.season} |{" "}
                                {col.series} | {col.edition}
                              </div>
                              <div className="text-sm text-gray-600">
                                {col.favourite && "⭐"}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleCollectionFavourite(col)
                                }
                                className={`text-sm ${
                                  col.favourite
                                    ? "text-yellow-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {col.favourite ? "Unfavourite" : "Favourite"}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(col)}
                                className="text-sm text-blue-600"
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          {col.releaseDate && (
                            <div className="text-sm text-gray-600">
                              Release:{" "}
                              {new Date(
                                col.releaseDate,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Home;