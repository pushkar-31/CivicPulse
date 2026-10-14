import Issue from "../models/Issue.js";

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTokens = (value) =>
  new Set(normalizeText(value).split(" ").filter(Boolean));

const calculateSimilarity = (first, second) => {
  const a = getTokens(first);
  const b = getTokens(second);

  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};

const hasValidCoordinates = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every(
    (coordinate) =>
      typeof coordinate === "number" && Number.isFinite(coordinate)
  ) &&
  coordinates[0] >= -180 &&
  coordinates[0] <= 180 &&
  coordinates[1] >= -90 &&
  coordinates[1] <= 90;

const isNearby = (first, second, radiusMeters = 100) => {
  if (!hasValidCoordinates(first) || !hasValidCoordinates(second)) {
    return false;
  }

  const [lon1, lat1] = first;
  const [lon2, lat2] = second;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));
  const distance =
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));

  return distance <= radiusMeters;
};

export const findSimilarIssues = async ({
  title,
  description,
  category,
  coordinates,
}) => {
  const existingIssues = await Issue.find({
    category,
    status: { $in: ["reported", "in-progress"] },
  })
    .select(
      "title description category status location.address location.coordinates createdAt"
    )
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const newText = `${title} ${description}`;

  return existingIssues
    .map((issue) => {
      const existingText = `${issue.title} ${issue.description}`;
      const similarity = calculateSimilarity(newText, existingText);
      const nearby = isNearby(coordinates, issue.location?.coordinates);

      return { issue, similarity, nearby };
    })
    .filter(({ similarity, nearby }) => nearby && similarity >= 0.35)
    .slice(0, 5)
    .map(({ issue, similarity, nearby }) => ({
      _id: issue._id,
      title: issue.title,
      category: issue.category,
      status: issue.status,
      address: issue.location?.address || "",
      createdAt: issue.createdAt,
      similarity: Math.round(similarity * 100),
      nearby,
    }));
};
