// SafeMarkdown.tsx
import React from "react";
import ReactMarkdown, { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { visit } from "unist-util-visit";
import type { Root } from "hast";
import type { Plugin } from "unified";

interface SafeMarkdownProps extends Options {
  forceColor?: string;
}

/** Plugin that runs as the VERY LAST rehype plugin and forces the color */
const rehypeForceColor: Plugin<[{ color: string }], Root> = ({ color }) => {
  if (!color) return () => {};
  const finalColor = String(color).trim();

  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "span") {
        node.properties ??= {};

        // This is the trick: overwrite the style completely and use !important
        // (or just set it as plain string – both work, !important is bulletproof)
        node.properties.style = `color: ${finalColor} !important;` as any;
      }
    });
  };
};

export default function SafeMarkdown({
  forceColor,
  ...props
}: SafeMarkdownProps) {
  // Extend default schema safely (no TS errors)
  const schema = {
    ...defaultSchema,
    attributes: {
      ...(defaultSchema.attributes ?? {}),
      span: [
        ...(defaultSchema.attributes?.span ?? []),
        ["style", /^color\s*:\s*#[0-9a-fA-F]{3,6}\s*;?\s*$/],
      ],
    },
  };

  const baseRemarkPlugins: Options["remarkPlugins"] = [remarkGfm];

  // Base plugins
  const basePlugins: Options["rehypePlugins"] = [
    rehypeRaw,
    [rehypeSanitize, schema],
  ];

  // If forceColor is set → add our plugin **as the very last one**
  if (forceColor) {
    basePlugins.push([rehypeForceColor, { color: forceColor }]);
  }

  // Merge user plugins (they come after our forceColor so user can still win if they want)
  const finalPlugins = props.rehypePlugins
    ? [...basePlugins, ...props.rehypePlugins]
    : basePlugins;

  const finalRemarkPlugins = props.remarkPlugins
    ? [...baseRemarkPlugins, ...props.remarkPlugins]
    : baseRemarkPlugins;

  return (
    <ReactMarkdown
      {...props}
      remarkPlugins={finalRemarkPlugins}
      rehypePlugins={finalPlugins}
    />
  );
}
