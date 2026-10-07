# NIH-CXR14 — NIH ChestX-ray14 dataset (image source, S13)

**Status:** an IMAGE source only (no clinical claim is taken from it). Used for one baseline radiograph (A-008 / A-009).

**Terms (SECONDARY, re-verify at the official NIH page — O16).** Google Cloud documentation <https://docs.cloud.google.com/healthcare-api/docs/resources/public-datasets/nih-chest> ("Last updated 2026-10-05 UTC", read 2026-10-06): "There are no restrictions on the use of the NIH chest x-ray images. However, the dataset has the following attribution requirements:" — (1) a link to the NIH download site <https://nihcc.app.box.com/v/ChestXray-NIHCC>; (2) a citation of Wang X, Peng Y, Lu L, Lu Z, Bagheri M, Summers R, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017; (3) acknowledgement that the NIH Clinical Center is the data provider. The official NIH page could not be read (Box page is a JS app; nih.gov returned Cloudflare 403).

**Metadata CSV:** `Data_Entry_2017_v2020.csv` (112,120 rows; columns Image Index, Finding Labels, Follow-up #, Patient ID, Patient Age, Patient Gender, View Position, original size and pixel spacing), fetched through the Hugging Face transport route (SHA-256 in A-008).

**Rules kept (S12-5, S12-13):** dataset used only after its terms were recorded and the owner approved; one image only; no archive downloaded; no generated or edited imagery; the Google Cloud bucket (Requester Pays) was not used.
