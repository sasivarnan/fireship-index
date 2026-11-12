import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { CHANNEL_URL, validateVideos } from "../index.ts";

export function parseXml(xml: string, now = Date.now()) {
  if (xml.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Invalid RSS document.");
  if (SyntaxValidator.validate(xml) !== true)
    throw new Error("Invalid RSS XML.");
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
  });
  const feed = parser.parse(xml).feed;
  const links = feed?.link ? [feed.link].flat() : [];
  if (
    !links.some(
      (link) => link["@_rel"] === "alternate" && link["@_href"] === CHANNEL_URL,
    )
  )
    throw new Error("This is not the Fireship feed.");
  const entries = feed.entry ? [feed.entry].flat() : [];
  return validateVideos(
    entries.map((entry) => ({
      id: entry.videoId,
      title: entry.title,
      description: entry.group?.description ?? "",
      published: entry.published,
    })),
    now,
  );
}
