"""Original editable About workbench hero. Run: blender --background --python scripts/work/build-about.py"""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
theme = 'about'
SOURCE = ROOT / 'assets/work' / theme
PUBLIC = ROOT / 'public/work' / theme
SOURCE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.name = 'Quantum Digital — ' + theme
model = bpy.data.collections.new('Editable workflow illustration')
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
        modifier.segments = 2
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

def text(name, body, location, size, mat):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.resolution_u = 1
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
    curve.bevel_resolution = 1
    spline = curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for vertex, coordinate in zip(spline.points, points):
        vertex.co = (*coordinate, 1)
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    curve.materials.append(mat)

box('Workbench slab', (0,0,.52), (5.2,2.2,.18), navy,.12)
for x in [-1.8,1.8]: box('Workbench feet',(x,.4,.24),(.16,.9,.45),ink,.045)
box('Interface monitor',(0,.36,2.0),(2.3,.18,1.72),navy,.1)
box('Monitor display',(0,.245,2.0),(2.08,.045,1.48),ink,.07)
box('Monitor rail',(-.73,.21,2.0),(.35,.025,1.17),navy,.035)
for i in range(4): box('Navigation indicator',(-.73,.188,2.43-i*.28),(.19,.016,.055),gold if i==1 else muted,.01)
for x,z,w in [(.14,2.38,1.09),(-.12,1.89,.58),(.56,1.89,.57)]:
    box('Interface panel',(x,.194,z),(w,.03,.31),navy,.045)
    box('Interface panel line',(x,.173,z),(.7*w,.015,.035),blue,.006)
box('Interface action',(.15,.192,1.5),(1.08,.035,.18),gold,.035)
box('Monitor stand',(0,.4,.91),(.28,.25,.55),ink,.03)
box('Monitor foot',(0,.18,.65),(1.1,.55,.07),navy,.035)
box('Phone body',(-1.8,-.22,1.48),(.85,.2,1.75),navy,.09)
box('Phone glass',(-1.8,-.335,1.48),(.71,.035,1.56),ink,.06)
for i in range(3):
    box('Mobile row',(-1.8,-.365,1.91-i*.33),(.56,.025,.22),navy,.032)
    box('Mobile row accent',(-1.8,-.382,1.91-i*.33),(.33,.01,.034),ice,.006)
box('Mobile action',(-1.8,-.36,.86),(.55,.025,.13),gold,.025)
box('Keyboard',(.1,-.63,.67),(1.57,.48,.09),ink,.04)
for row in range(3):
    for column in range(9): box('Keyboard key',(-.51+column*.15,-.75+row*.12,.726),(.095,.07,.015),muted,0)
box('Document',(-1.34,-.8,.658),(.72,.8,.035),paper,.035)
for i,width in enumerate([.52,.43,.49,.3]): box('Document line',(-1.34,-.55-i*.14,.682),(width,.028,.008),muted,.003)
box('Document marker',(-1.34,-1.04,.688),(.38,.065,.014),gold,.008)
box('Robot body',(1.79,-.05,1.02),(.77,.63,.61),gold,.09)
box('Robot upper',(1.79,-.05,1.49),(.55,.48,.38),navy,.06)
for x in [1.65,1.92]: box('Robot eye',(x,-.303,1.5),(.1,.03,.1),ice,.025)
for x in [1.37,2.21]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.22, depth=.08, location=(x,-.05,.85), rotation=(0,math.pi/2,0))
    register(bpy.context.object,'Robot wheel',navy)
line('Workbench connection',[(-1.36,-.36,.72),(-1.02,-.3,.72),(-.93,.02,.72)],blue,.012)
line('Robot connection',[(.99,.02,.72),(1.25,.02,.72),(1.37,-.25,.72)],gold,.012)

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
target = Vector((0, .05, 1.45))
for name, location, energy, size, color in [('Soft key', (0,-6,8),900,6,(1,.95,.86)),('Blue rim',(4,3,6),1100,5,(.55,.76,1)),('Soft fill',(-5,-2,3),550,4,(.75,.85,1))]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.size, light.data.color = energy, size, color
    light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,-11,6.6))
camera = bpy.context.object
camera.name = 'Hero initial camera'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 7.3
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
(SOURCE/'manifest.json').write_text(json.dumps({'blender':bpy.app.version_string,'camera':list(camera.location),'target':list(target),'orthographicScale':camera.data.ortho_scale,'resolution':[1600,1400],'triangles':triangles,'glbBytes':(PUBLIC/f'{theme}-hero.glb').stat().st_size,'illustration':'Original conceptual workbench connecting interfaces, mobile products, documents, and robotics; no portrait or client interface.'},indent=2)+'\n')
print(theme, 'exported:', triangles, 'triangles')
