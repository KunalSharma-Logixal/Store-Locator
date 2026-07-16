# import os
# import pandas as pd

# def generate_sample_files(data_dir: str):
#     """
#     Generates dummy data CSV and Excel template files
#     for multiple tenants to test the master uploader.
#     """
#     csv_path = os.path.join(data_dir, "sample_stores.csv")
#     xlsx_path = os.path.join(data_dir, "sample_stores.xlsx")

#     # Sample stores data with different tenant assignments
#     data = [
#         {
#             "tenant_id": "VPRO",
#             "store_id": "sf-down",
#             "name": "Downtown Tech Hub Store",
#             "address": "123 Market St",
#             "city": "San Francisco",
#             "phone": "+1 415-555-0101",
#             "latitude": 37.7749,
#             "longitude": -122.4194
#         },
#         {
#             "tenant_id": "VPRO",
#             "store_id": "sf-gold",
#             "name": "Golden Gate Parks Store",
#             "address": "501 Stanyan St",
#             "city": "San Francisco",
#             "phone": "+1 415-555-0102",
#             "latitude": 37.7694,
#             "longitude": -122.4862
#         },
#         {
#             "tenant_id": "VFASHION",
#             "store_id": "sf-fish",
#             "name": "Fisherman's Wharf Store",
#             "address": "2801 Jones St",
#             "city": "San Francisco",
#             "phone": "+1 415-555-0103",
#             "latitude": 37.8080,
#             "longitude": -122.4177
#         },
#         {
#             "tenant_id": "VFASHION",
#             "store_id": "",  # Testing empty ID generation
#             "name": "Union Square Retail",
#             "address": "300 Post St",
#             "city": "San Francisco",
#             "phone": "+1 415-555-0104",
#             "latitude": 37.7886,
#             "longitude": -122.4075
#         },
#         {
#             "tenant_id": "VPRO",
#             "store_id": "sf-pres",
#             "name": "Presidio Visitor Shop",
#             "address": "210 Lincoln Blvd",
#             "city": "San Francisco",
#             "phone": "+1 415-555-0105",
#             "latitude": 37.7988,
#             "longitude": -122.4662
#         },
#         {
#             "tenant_id": "VPRO",
#             "store_id": "oak-bay",
#             "name": "Oakland Bay Store",
#             "address": "1 Broadway",
#             "city": "Oakland",
#             "phone": "+1 510-555-0201",
#             "latitude": 37.7932,
#             "longitude": -122.2765
#         },
#         {
#             "tenant_id": "VPRO",
#             "store_id": "berk-hub",
#             "name": "Berkeley Hub",
#             "address": "2200 Shattuck Ave",
#             "city": "Berkeley",
#             "phone": "+1 510-555-0202",
#             "latitude": 37.8715,
#             "longitude": -122.2682
#         },
#         {
#             "tenant_id": "VPRO",
#             "store_id": "duplicate-test",  # Row to test duplicate handling
#             "name": "Berkeley Hub Duplicate Test",
#             "address": "2200 Shattuck Ave",
#             "city": "Berkeley",
#             "phone": "+1 510-555-0202",
#             "latitude": 37.8715,
#             "longitude": -122.2682
#         }
#     ]

#     df = pd.DataFrame(data)

#     # Save CSV (always overwrite to guarantee latest columns format)
#     df.to_csv(csv_path, index=False)

#     # Save Excel
#     df.to_excel(xlsx_path, index=False, engine='openpyxl')
