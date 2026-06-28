import {
  SAMPLE_REVIEWS_CSV_PATH,
  SAMPLE_REVIEWS_FILENAME,
} from "@/lib/constants";

export async function fetchSampleReviewsFile(): Promise<File> {
  const response = await fetch(SAMPLE_REVIEWS_CSV_PATH);
  if (!response.ok) {
    throw new Error("Could not load sample reviews file.");
  }
  const blob = await response.blob();
  return new File([blob], SAMPLE_REVIEWS_FILENAME, { type: "text/csv" });
}
