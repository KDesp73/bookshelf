export const COMIC_PATTERN = "comic|graphic novel|manga|manhwa|manhua|bande dessinée|fumetti|comix";

function comicMatchExpression(field: string) {
  return {
    $reduce: {
      input: { $ifNull: [field, []] },
      initialValue: false,
      in: {
        $or: [
          "$$value",
          { $regexMatch: { input: "$$this", regex: COMIC_PATTERN, options: "i" } },
        ],
      },
    },
  } as const;
}

export function comicReadWeight() {
  return {
    $sum: {
      $cond: [
        {
          $or: [
            comicMatchExpression("$tags"),
            comicMatchExpression("$genres"),
            comicMatchExpression("$subjects"),
            comicMatchExpression("$categories"),
          ],
        },
        0.5,
        1,
      ],
    },
  } as const;
}
