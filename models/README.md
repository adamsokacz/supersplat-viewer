# Models

Place **3D Gaussian Splat** files here. Must be the specialized PLY/SOG format from Gaussian Splatting — **not** regular mesh PLY (vertices + faces from 3D scanners).

Supported: `.ply`, `.sog`, `.meta.json`, `.lod-meta.json`

## EC2 + Mounted Volume

You can mount an EFS or EBS volume at this directory. With `npm run develop`:
- `public/models` is a symlink to this folder
- New files on the mount appear immediately—no build required

```bash
# Example: mount EFS at models/
sudo mkdir -p models
sudo mount -t nfs4 -o nfsvers=4.1 fs-xxx.efs.region.amazonaws.com:/ models
```

When hosting, share links: `https://your-domain.com/?content=./models/your-scene.ply`
