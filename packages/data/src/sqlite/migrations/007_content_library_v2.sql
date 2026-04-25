WITH generated_titles AS (
  SELECT
    content_library_items.id AS content_item_id,
    CASE
      WHEN generation_requests.topic IS NOT NULL AND trim(generation_requests.topic) <> '' THEN
        upper(substr(trim(generation_requests.topic), 1, 1)) || substr(trim(generation_requests.topic), 2)
      ELSE 'Generated content'
    END AS title
  FROM content_library_items
  LEFT JOIN generation_requests
    ON generation_requests.session_id = content_library_items.source_locator
  WHERE content_library_items.source_type = 'generated'
)
UPDATE content_library_items
SET title = (
  SELECT generated_titles.title
  FROM generated_titles
  WHERE generated_titles.content_item_id = content_library_items.id
)
WHERE id IN (
  SELECT content_item_id
  FROM generated_titles
);