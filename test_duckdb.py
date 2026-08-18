import duckdb
import polars as pl
df = pl.DataFrame({"Region": ["North America", "Europe"]})
conn = duckdb.connect()
arrow = df.to_arrow()
conn.register("dataset", arrow)
try:
    print(conn.execute('SELECT SUM(TRY_CAST("Region" AS DOUBLE)) as "Region" FROM dataset').fetchall())
except Exception as e:
    print("ERROR:", e)
