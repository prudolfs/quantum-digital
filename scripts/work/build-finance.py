"""Create the finance case-study illustration, editable source and compact GLB.

Run: blender --background --python scripts/work/build-finance.py
This isolated background scene contains synthetic illustration data only.
"""
import json
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/work/finance'
PUBLIC = ROOT / 'public/work/finance'
SOURCE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.name = 'Quantum Digital — document to evidence'
model = bpy.data.collections.new('Finance illustration')
scene.collection.children.link(model)


def material(name, color, metallic=0, roughness=.4):
    color = tuple(int(color[i:i+2], 16) / 255 for i in (1, 3, 5))
    linear = tuple(c / 12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in color)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*linear, 1)
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*linear, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


navy = material('Navy #0A2038', '#0A2038', .3)
blue = material('Blue #238BFF', '#238BFF', .2)
gold = material('Gold #F5B85B', '#F5B85B', .35)
paper = material('Warm paper #F7FBFF', '#F7FBFF', 0, .65)
ink = material('Document ink #17334A', '#17334A')
ice = material('Ice #CCE9FA', '#CCE9FA', .15)
muted = material('Metadata #8FA8BA', '#8FA8BA')


def register(obj, name, mat):
    obj.name = name
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    model.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def box(name, location, dimensions, mat, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = register(bpy.context.object, name, mat)
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Rounded edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def text(name, body, location, size, mat):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.extrude = 0
    curve.resolution_u = 2
    curve.align_x = 'LEFT'
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi/2, 0, 0)
    curve.materials.append(mat)
    return obj


def line(name, points, mat, radius=.018):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 1
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for vertex, coordinate in zip(spline.points, points):
        vertex.co = (*coordinate, 1)
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    curve.materials.append(mat)
    return obj


# Three individually addressable layers for the later optional interaction.
layers = [(-1.65, -.5, 1.72), (.15, .18, 1.88), (1.85, .86, 2.04)]
for name, position, mat in zip(['01 source', '02 structured data', '03 calculated answer'], layers, [paper, navy, navy]):
    box(name, position, (1.8, .13, 2.5), mat, .07)

x, y, z = layers[0]
face = y-.079
text('Receipt heading', 'RECEIPT', (x-.68, face, z+.9), .21, ink)
text('Receipt metadata', 'DEMO / EUR', (x-.68, face, z+.65), .11, ink)
for i, width in enumerate([1.25, .94, 1.1, .74]):
    box('Printed receipt line', (x-.06, face, z+.29-i*.2), (width, .018, .036), muted, .009)
box('Total divider', (x, face, z-.61), (1.32, .018, .015), muted, .003)
text('Receipt total', 'TOTAL  42.80', (x-.68, face-.003, z-.86), .16, ink)
box('Receipt source marker', (x+.58, face-.01, z+.88), (.16, .026, .16), gold, .025)

x, y, z = layers[1]
face = y-.082
text('Data heading', 'REVIEW', (x-.67, face, z+.9), .2, ice)
text('Data subheading', 'DOCUMENT DATA', (x-.67, face, z+.66), .09, muted)
for i, (label, value) in enumerate([('SUPPLIER', 'Demo supplier'), ('CURRENCY', 'EUR'), ('TOTAL', '42.80')]):
    row = z+.23-i*.48
    box('Reviewed field', (x, face, row), (1.45, .035, .37), ink, .035)
    text('Field label '+label, label, (x-.61, face-.024, row+.065), .08, muted)
    text('Field value '+label, value, (x-.61, face-.025, row-.092), .13, paper)
    box('Confirmation '+label, (x+.55, face-.03, row), (.08, .02, .08), gold, .018)

x, y, z = layers[2]
face = y-.082
text('Answer heading', 'INSIGHT', (x-.68, face, z+.9), .2, ice)
text('Answer subheading', 'CALCULATED / EUR', (x-.68, face, z+.65), .085, muted)
for i, height in enumerate([.43, .74, 1.07]):
    box('Calculated bar '+str(i), (x-.48+i*.46, face-.03, z-.53+height/2), (.27, .065, height), gold if i == 2 else blue, .035)
box('Chart baseline', (x, face, z-.59), (1.4, .025, .025), muted, .007)
box('Source reference chip', (x, face-.014, z-.89), (1.42, .045, .28), ink, .06)
text('Source reference', 'VIEW SOURCE', (x-.58, face-.041, z-.935), .115, ice)

# Sparse connectors suggest traceability without making a technical diagram.
line('Source to review', [(-.8, -.58, .59), (-.52, -.65, .4), (.2, -.65, .4), (.35, .09, .65)], gold)
line('Review to insight', [(.99, .09, .78), (1.2, -.15, .48), (1.95, -.15, .48), (2.05, .77, .82)], gold)

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1400
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
world = bpy.data.worlds.new('Neutral studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.15, .2, .3, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .45
scene.world = world
target = Vector((.12, .16, 1.7))
for name, location, energy, size, color in [
    ('Soft key', (0, -6, 8), 900, 6, (1, .95, .86)),
    ('Blue rim', (4, 3, 6), 1100, 5, (.55, .76, 1)),
    ('Soft fill', (-5, -2, 3), 550, 4, (.75, .85, 1)),
]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.size = size
    light.data.color = color
    light.rotation_euler = (target-light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(location=(5.1, -10, 5.6))
camera = bpy.context.object
camera.name = 'Hero initial camera'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 7.35
camera.rotation_euler = (target-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(SOURCE/'finance-hero.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'finance-hero.blend'))

# Export only illustration geometry, with no lights/cameras and applied bevels.
bpy.ops.object.select_all(action='DESELECT')
for obj in model.objects:
    obj.select_set(True)
    if obj.type in {'FONT', 'CURVE'}:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'finance-hero.glb'), export_format='GLB', use_selection=True, export_apply=True, export_cameras=False, export_lights=False)
bpy.ops.render.render(write_still=True)
depsgraph = bpy.context.evaluated_depsgraph_get()
triangles = 0
for obj in model.objects:
    if obj.type == 'MESH':
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        obj.evaluated_get(depsgraph).to_mesh_clear()
(SOURCE/'manifest.json').write_text(json.dumps({
    'blender': bpy.app.version_string,
    'camera': list(camera.location),
    'target': list(target),
    'orthographicScale': camera.data.ortho_scale,
    'resolution': [1600, 1400],
    'triangles': triangles,
    'glbBytes': (PUBLIC/'finance-hero.glb').stat().st_size,
    'illustration': 'Synthetic conceptual document, review fields and chart; not a shipped interface or calculated dataset.',
}, indent=2)+'\n')
print('Finance illustration exported:', triangles, 'triangles')
