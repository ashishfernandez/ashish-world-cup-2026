-- Medal pick breakdown: % of pool predicting each country for 1st / 2nd / 3rd
-- Run in Supabase → SQL Editor
--
-- Logic matches app.js getPredictedMedalists():
--   1st (gold)   = data.champ OR bracketPicks["32"] (final winner)
--   2nd (silver) = the other finalist in match 32 (winners of semis 29 & 30)
--   3rd (bronze) = bracketPicks["31"] (bronze match winner)

WITH team_names (code, country_name) AS (
  VALUES
    ('MEX', 'Mexico'), ('RSA', 'South Africa'), ('KOR', 'South Korea'), ('CZE', 'Czechia'),
    ('CAN', 'Canada'), ('SUI', 'Switzerland'), ('QAT', 'Qatar'), ('BIH', 'Bosnia & Herz.'),
    ('BRA', 'Brazil'), ('MAR', 'Morocco'), ('SCO', 'Scotland'), ('HAI', 'Haiti'),
    ('USA', 'United States'), ('PAR', 'Paraguay'), ('AUS', 'Australia'), ('TUR', 'Turkey'),
    ('GER', 'Germany'), ('CUW', 'Curaçao'), ('CIV', 'Ivory Coast'), ('ECU', 'Ecuador'),
    ('NED', 'Netherlands'), ('JPN', 'Japan'), ('TUN', 'Tunisia'), ('SWE', 'Sweden'),
    ('BEL', 'Belgium'), ('EGY', 'Egypt'), ('IRN', 'Iran'), ('NZL', 'New Zealand'),
    ('ESP', 'Spain'), ('URU', 'Uruguay'), ('KSA', 'Saudi Arabia'), ('CPV', 'Cape Verde'),
    ('FRA', 'France'), ('SEN', 'Senegal'), ('NOR', 'Norway'), ('IRQ', 'Iraq'),
    ('ARG', 'Argentina'), ('AUT', 'Austria'), ('ALG', 'Algeria'), ('JOR', 'Jordan'),
    ('POR', 'Portugal'), ('COL', 'Colombia'), ('UZB', 'Uzbekistan'), ('COD', 'DR Congo'),
    ('ENG', 'England'), ('CRO', 'Croatia'), ('GHA', 'Ghana'), ('PAN', 'Panama')
),

pool_entries AS (
  SELECT
    s.id,
    COALESCE(NULLIF(TRIM(s.data->>'name'), ''), s.id) AS participant_name,
    NULLIF(TRIM(COALESCE(NULLIF(TRIM(s.data->>'champ'), ''), s.data->'bracketPicks'->>'32')), '') AS gold_code,
    NULLIF(TRIM(s.data->'bracketPicks'->>'29'), '') AS final_home_code,
    NULLIF(TRIM(s.data->'bracketPicks'->>'30'), '') AS final_away_code,
    NULLIF(TRIM(s.data->'bracketPicks'->>'31'), '') AS bronze_code
  FROM submissions s
),

medal_picks AS (
  SELECT
    id,
    participant_name,
    gold_code,
    CASE
      WHEN gold_code IS NOT NULL
       AND final_home_code IS NOT NULL
       AND final_away_code IS NOT NULL
      THEN CASE WHEN gold_code = final_home_code THEN final_away_code ELSE final_home_code END
      ELSE NULL
    END AS silver_code,
    bronze_code
  FROM pool_entries
),

totals AS (
  SELECT COUNT(*)::numeric AS total_entries FROM pool_entries
),

unpivoted AS (
  SELECT '1st (Gold)'   AS placement, gold_code   AS team_code FROM medal_picks
  UNION ALL
  SELECT '2nd (Silver)' AS placement, silver_code AS team_code FROM medal_picks
  UNION ALL
  SELECT '3rd (Bronze)' AS placement, bronze_code AS team_code FROM medal_picks
),

aggregated AS (
  SELECT
    u.placement,
    COALESCE(u.team_code, '(no pick)') AS team_code,
    COALESCE(tn.country_name, CASE WHEN u.team_code IS NULL THEN '(no pick)' ELSE u.team_code END) AS country_name,
    COUNT(*) AS pick_count
  FROM unpivoted u
  LEFT JOIN team_names tn ON tn.code = u.team_code
  GROUP BY u.placement, u.team_code, tn.country_name
)

SELECT
  a.placement,
  a.country_name,
  a.team_code,
  a.pick_count,
  t.total_entries::int AS total_pool_entries,
  ROUND(100.0 * a.pick_count / NULLIF(t.total_entries, 0), 1) AS pct_of_pool
FROM aggregated a
CROSS JOIN totals t
ORDER BY
  CASE a.placement
    WHEN '1st (Gold)' THEN 1
    WHEN '2nd (Silver)' THEN 2
    WHEN '3rd (Bronze)' THEN 3
  END,
  a.pick_count DESC,
  a.country_name;

-- Optional: one row per participant with their three picks
-- SELECT * FROM medal_picks ORDER BY participant_name;
