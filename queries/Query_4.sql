SELECT 
    g.app_id,
    g.name,
    LENGTH(gd.detailed_description) as description_length,
    LEFT(gd.detailed_description, 500) as description_preview,
    RIGHT(gd.detailed_description, 200) as description_end
FROM games g
LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
WHERE LOWER(g.name) LIKE '%phasmophobia%';