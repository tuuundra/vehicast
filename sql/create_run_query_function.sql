-- Create a function to run arbitrary SQL queries
CREATE OR REPLACE FUNCTION run_query(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$; 