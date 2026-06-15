// CameraManagement.js
const [cameras, setCameras] = useState([]);
useEffect(() => {
  axios.get('/api/camera_settings/', { headers: { Authorization: `Bearer ${token}` } }).then(res => setCameras(res.data));
}, []);
const addCamera = (name, url, gate) => {
  axios.post('/api/camera_settings/', { name, url, gate_number: gate }, { headers: { Authorization: `Bearer ${token}` } }).then(() => refresh());
};