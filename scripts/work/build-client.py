"""Create original abstract mobile-work illustrations with editable sources.
Run: blender --background --python scripts/work/build-client.py -- care
Or:  blender --background --python scripts/work/build-client.py -- accounting
"""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
theme = sys.argv[-1]
if theme not in {'care', 'accounting'}:
    raise ValueError('Choose care or accounting after --')
SOURCE = ROOT / 'assets/work' / theme
PUBLIC = ROOT / 'public/work' / theme
SOURCE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.name = 'Quantum Digital — ' + theme
model = bpy.data.collections.new('Editable mobile illustration')
scene.collection.children.link(model)

def material(name, color, metallic=0, roughness=.4):
    color = tuple(int(color[i:i+2], 16) / 255 for i in (1, 3, 5))
    linear = tuple(c / 12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in color)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*linear, 1)
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*linear, 1)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = roughness
    return mat

navy = material('Navy #0A2038', '#0A2038', .3)
blue = material('Blue #238BFF', '#238BFF', .2)
gold = material('Gold #F5B85B', '#F5B85B', .35)
paper = material('Warm paper #F7FBFF', '#F7FBFF', 0, .65)
ink = material('Panel #17334A', '#17334A')
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
    curve.resolution_u = 2
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi/2, 0, 0)
    curve.materials.append(mat)
    return obj

def line(name, points, mat, radius=.018):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for vertex, coordinate in zip(spline.points, points):
        vertex.co = (*coordinate, 1)
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    curve.materials.append(mat)

def phone():
    box('Rounded phone body', (0, 0, 1.9), (1.8, .25, 3.4), navy, .16)
    box('Phone glass', (0, -.15, 1.9), (1.58, .065, 3.14), ink, .13)
    box('Camera pill', (0, -.193, 3.3), (.5, .03, .1), navy, .045)
    box('Home indicator', (0, -.194, .47), (.48, .015, .025), ice, .009)
    box('Side button', (.915, -.015, 2.5), (.025, .1, .4), gold, .012)

phone()
if theme == 'care':
    text('Request heading', 'HELP REQUEST', (-.63, -.192, 2.93), .135, paper)
    for z, label, value in [(2.48, 'TYPE', 'Shopping'), (1.9, 'WHEN', 'Tomorrow'), (1.32, 'DURATION', '1 hour')]:
        box('Request field ' + label, (0, -.2, z), (1.35, .04, .45), navy, .045)
        text('Field label ' + label, label, (-.56, -.225, z+.085), .075, muted)
        text('Field value ' + label, value, (-.56, -.226, z-.12), .15, ice)
    box('Review button', (0, -.205, .79), (1.32, .045, .3), gold, .065)
    text('Review label', 'REVIEW', (-.31, -.234, .74), .13, ink)
    for x, y, z, label, surface, foreground in [(-1.95, .2, 2.85, 'SENIOR', paper, ink), (1.8, .3, 2.95, 'FAMILY', navy, ice), (1.65, .35, 1.05, 'HELPER', navy, ice)]:
        box('Role ' + label, (x, y, z), (1.35, .12, 1.05), surface, .12)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.11, location=(x, y-.11, z+.2))
        register(bpy.context.object, label+' avatar', gold)
        text(label+' label', label, (x-.39, y-.077, z-.22), .145, foreground)
    line('Senior request connection', [(-1.28, .12, 2.85), (-1.02, .12, 2.85), (-.91, -.05, 2.5)], blue)
    line('Family shared context', [(.91, 0, 2.8), (1.02, .2, 2.95), (1.13, .2, 2.95)], gold)
    line('Helper shared context', [(.91, 0, 1.2), (1.0, .2, 1.05)], gold)
    box('Voice tile', (-1.8, -.22, 1.05), (1.35, .13, .64), navy, .1)
    for i, height in enumerate([.1, .2, .32, .21, .41, .27, .13]):
        box('Voice waveform '+str(i), (-2.21+i*.135, -.3, 1.05), (.055, .025, height), gold, .02)
    line('Voice into request', [(-1.12, -.22, 1.05), (-.95, -.22, 1.05)], blue)
else:
    text('Accounting heading', 'DOCUMENT', (-.59, -.194, 2.94), .15, paper)
    text('Accounting subheading', 'REVIEW THE DETAILS', (-.59, -.194, 2.69), .075, muted)
    for z, label, value in [(2.24, 'TOTAL', 'EUR 35.40'), (1.63, 'CATEGORY', 'Office supplies')]:
        box('Accounting field '+label, (0, -.2, z), (1.34, .04, .49), navy, .045)
        text('Accounting label '+label, label, (-.57, -.225, z+.1), .075, muted)
        text('Accounting value '+label, value, (-.57, -.226, z-.12), .118, ice)
    box('Continue button', (0, -.205, .94), (1.32, .045, .31), gold, .065)
    text('Continue label', 'CONTINUE', (-.4, -.234, .88), .12, ink)
    box('Receipt', (-1.75, -.36, 2.06), (1.35, .1, 2.17), paper, .06)
    text('Receipt heading', 'RECEIPT', (-2.28, -.422, 2.85), .16, ink)
    text('Receipt demo label', 'DEMO', (-2.28, -.422, 2.59), .09, ink)
    for i, width in enumerate([.98, .79, .94, .61]):
        box('Receipt printed line', (-1.76, -.426, 2.31-i*.2), (width, .02, .03), muted, .006)
    text('Receipt total', 'EUR 35.40', (-2.28, -.422, 1.26), .15, ink)
    for z, label, surface, foreground in [(2.7, 'EXTRACT', navy, ice), (1.78, 'CATEGORY', navy, ice), (.86, 'REVIEW', gold, ink)]:
        box('Expense step '+label, (1.65, .4, z), (1.5, .12, .66), surface, .09)
        text('Step label '+label, label, (1.04, .321, z-.07), .15, foreground)
    line('Receipt into mobile', [(-1.08, -.42, 1.5), (-.95, -.42, 1.5), (-.87, -.19, 1.7)], gold)
    line('Mobile to bookkeeping', [(.91, -.05, 1.25), (1.13, .25, 1.25), (1.22, .32, 1.12)], gold)

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
target = Vector((-.06, .08, 1.92))
for name, location, energy, size, color in [('Soft key', (0,-6,8),900,6,(1,.95,.86)),('Blue rim',(4,3,6),1100,5,(.55,.76,1)),('Soft fill',(-5,-2,3),550,4,(.75,.85,1))]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.size, light.data.color = energy, size, color
    light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4.2,-11,5.4))
camera = bpy.context.object
camera.name = 'Hero initial camera'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 6.9
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera = camera
scene.render.filepath = str(SOURCE/f'{theme}-hero.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{theme}-hero.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in model.objects:
    obj.select_set(True)
    if obj.type in {'FONT','CURVE'}:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/f'{theme}-hero.glb'), export_format='GLB', use_selection=True, export_apply=True, export_cameras=False, export_lights=False)
bpy.ops.render.render(write_still=True)
depsgraph = bpy.context.evaluated_depsgraph_get()
triangles = 0
for obj in model.objects:
    if obj.type == 'MESH':
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
(SOURCE/'manifest.json').write_text(json.dumps({'blender':bpy.app.version_string,'camera':list(camera.location),'target':list(target),'orthographicScale':camera.data.ortho_scale,'resolution':[1600,1400],'triangles':triangles,'glbBytes':(PUBLIC/f'{theme}-hero.glb').stat().st_size,'illustration':'Original abstract mobile workflow with synthetic values and roles.'},indent=2)+'\n')
print(theme, 'exported:', triangles, 'triangles')
