cd UXR

npm install
cd backend && npm install && cd ../frontend && npm install
cd ../py_api && conda env create -f environment.yml && cd ..

conda activate uxr_api

npm run dev
