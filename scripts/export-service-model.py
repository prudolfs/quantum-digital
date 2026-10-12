"""Export real service geometry with a camera-projected baked studio texture.
Prepare texture: node scripts/prepare-service-images.mjs product --lighting
Run: blender --background --python scripts/export-service-model.py -- --theme product --render-background
The projected beauty texture preserves the reviewed lighting for a small tilt;
reflections/highlights are baked, not recalculated as the model moves.
"""
import argparse
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--theme', choices=['product', 'ai', 'workflow', 'integration'], required=True)
parser.add_argument('--render-background', action='store_true')
options = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
theme = options.theme
source = ROOT / 'assets' / 'services' / theme
output = ROOT / 'public' / 'services' / theme
output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source / f'{theme}-hero.blend'))
scene = bpy.context.scene
camera = scene.camera
resolution = [scene.render.resolution_x, scene.render.resolution_y]
target = Vector((0, 0, 0.45))
bpy.context.preferences.filepaths.save_version = 0
meshes = [obj for obj in scene.objects if obj.type == 'MESH' and obj.name != 'Studio floor']

# A separate plate retains the floor and the actual baked studio shadow.
# The illustration still casts shadows but is invisible to camera rays.
if options.render_background:
    for obj in meshes:
        obj.visible_camera = False
    scene.cycles.samples = 16
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(source / f'{theme}-background.png')
    bpy.ops.render.render(write_still=True)
    for obj in meshes:
        obj.visible_camera = True

texture = bpy.data.images.load(str(source / f'{theme}-lighting.jpg'))
texture.colorspace_settings.name = 'sRGB'
material = bpy.data.materials.new('Baked studio appearance — subtle tilt only')
material.use_nodes = True
nodes = material.node_tree.nodes
nodes.clear()
image = nodes.new('ShaderNodeTexImage')
image.image = texture
image.extension = 'EXTEND'
surface = nodes.new('ShaderNodeOutputMaterial')
# A color socket directly on Surface is recognized as KHR_materials_unlit.
material.node_tree.links.new(image.outputs['Color'], surface.inputs['Surface'])

bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for modifier in obj.modifiers:
        if modifier.type == 'BEVEL':
            modifier.segments = 2
    bpy.ops.object.convert(target='MESH')
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='Baked studio projection')
    for loop in obj.data.loops:
        point = world_to_camera_view(scene, camera, obj.matrix_world @ obj.data.vertices[loop.vertex_index].co)
        uv.data[loop.index].uv = (point.x, point.y)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0
    obj.select_set(False)
for obj in meshes:
    obj.select_set(True)
model = output / f'{theme}-hero.glb'
bpy.ops.export_scene.gltf(
    filepath=str(model), export_format='GLB', use_selection=True,
    export_apply=True, export_cameras=False, export_lights=False,
    export_image_format='AUTO',
)
if model.stat().st_size > 320_000:
    raise ValueError('Service model exceeds 320 KB budget.')
triangles = 0
for obj in meshes:
    obj.data.calc_loop_triangles()
    triangles += len(obj.data.loop_triangles)
points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
web_points = [(point.x, point.z, -point.y) for point in points]
bounds = {
    'min': [min(point[axis] for point in web_points) for axis in range(3)],
    'max': [max(point[axis] for point in web_points) for axis in range(3)],
}
horizontal_span = camera.data.ortho_scale
view = {
    'width': 1400,
    'height': round(1400 * resolution[1] / resolution[0]),
    'camera': [camera.location.x, camera.location.z, -camera.location.y],
    'target': [target.x, target.z, -target.y],
    'horizontalSpan': horizontal_span,
    'verticalSpan': horizontal_span * resolution[1] / resolution[0],
    'cropShift': [0, 0],
}
(source / 'view.json').write_text(json.dumps(view, indent=2) + '\n')
(source / 'model.json').write_text(json.dumps({
    'blender': bpy.app.version_string,
    'source': f'{theme}-hero.blend',
    'model': f'{theme}-hero.glb',
    'bytes': model.stat().st_size,
    'triangles': triangles,
    'bounds': bounds,
    'meshes': [obj.name for obj in meshes],
    'excluded': ['Studio floor', 'camera', 'lights'],
    'lighting': 'Camera-projected studio beauty texture; KHR_materials_unlit',
    'texture': f'{theme}-lighting.jpg',
    'textureBytes': (source / f'{theme}-lighting.jpg').stat().st_size,
    'limitation': 'Baked highlights and shadow are fixed; use a bounded tilt, not orbit controls.',
}, indent=2) + '\n')
print('Service model:', model.stat().st_size, 'bytes;', triangles, 'triangles')
