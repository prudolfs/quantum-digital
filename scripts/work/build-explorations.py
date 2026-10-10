"""Original research, dispatch, and robotics hero models; run with -- research/services/robotics."""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
theme = sys.argv[-1]
if theme not in {'research', 'services', 'robotics'}:
    raise ValueError('Choose research, services or robotics after --')
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

if theme == 'research':
    box('Research workspace', (.18,.2,1.95), (3,.18,2.8), navy, .14)
    text('Workspace title', 'RESEARCH', (-1.08,.095,3.02), .22, ice)
    text('Synthetic record label', 'EXAMPLE OPPORTUNITY', (-1.08,.09,2.66), .085, muted)
    for i, (label, width) in enumerate([('REVIEW',1.6), ('VERIFY',1.22), ('DRAFT',1.82)]):
        z = 2.25-i*.57
        box('Pipeline stage '+label, (.16,.085,z), (2.45,.075,.43), ink, .05)
        box('Stage marker '+label, (-.88,.033,z), (.09,.022,.19), gold if i == 1 else blue, .015)
        text('Pipeline text '+label, label, (-.65,.033,z-.055), .145, ice)
        box('Evidence indicator '+label, (.82,.029,z), (.26,.02,.045), gold, .01)
    box('Workspace stand', (.2,.35,.35), (.45,.4,.38), ink, .05)
    box('Workspace foot', (.2,.15,.16), (2.0,.8,.12), navy, .05)
    for i, (x,z) in enumerate([(-2.05,2.8),(-2.12,1.7),(-1.97,.62)]):
        box('Source card '+str(i), (x,-.2,z), (1.05,.09,.77), paper, .07)
        for j in range(3): box('Source line', (x,-.258,z+.16-j*.15), (.72-j*.12,.012,.035), muted, .006)
        line('Source to pipeline '+str(i), [(x+.54,-.17,z),(x+.7,-.17,z),(-1.35,.07,2.25-min(i,2)*.57)], blue, .014)
    box('Reviewed draft', (2.12,-.1,1.6), (1.05,.12,1.45), gold, .09)
    text('Draft heading', 'DRAFT', (1.69,-.171,2.07), .15, ink)
    for i in range(4): box('Draft line', (2.12,-.171,1.84-i*.18), (.72-i*.08,.015,.035), ink, .007)
    line('Pipeline to reviewed draft', [(1.7,.05,1.11),(1.92,-.06,1.11)], gold)
elif theme == 'services':
    box('Dispatch board', (-.65,.18,2.04), (3.1,.22,2.8), navy, .13)
    text('Dispatch title', 'DISPATCH', (-1.92,.05,3.1), .22, ice)
    for i, label in enumerate(['CLIENT','WORKER','MANAGER']):
        x=-1.65+i*1.03
        text('Role '+label,label,(x-.37,.049,2.74),.09,muted)
        box('Role job card '+label,(x,.01,2.14),( .83,.12,.8),ink,.06)
        box('Role status marker '+label,(x,-.06,2.39),(.55,.02,.05),gold if i == 1 else blue,.012)
        for j in range(2): box('Job context line',(x,-.06,2.13-j*.14),(.55-j*.1,.02,.03),ice,.006)
    box('Conversation band',(-.65,-.015,1.28),(2.7,.12,.58),ink,.06)
    text('Conversation label','JOB + CONVERSATION',(-1.84,-.086,1.28),.115,ice)
    for i,h in enumerate([.12,.25,.36,.19,.29]): box('Voice waveform',(-1.8+i*.12,-.092,.87),(.045,.02,h),gold,.009)
    text('Voice draft label','VOICE DRAFT',(-.98,-.09,.8),.1,muted)
    box('Operations phone',(1.72,-.23,1.64),(1.28,.25,2.5),navy,.12)
    box('Phone glass',(1.72,-.379,1.64),(1.08,.05,2.22),ink,.08)
    text('Phone heading','JOB UPDATE',(1.29,-.409,2.38),.105,ice)
    for i,z in enumerate([2.02,1.6,1.18]):
        box('Suggested reply '+str(i),(1.72,-.413,z),(.88,.04,.29),navy,.045)
        box('Suggestion line',(1.72,-.44,z),(.62,.01,.035),muted,.006)
    box('Edit reply button',(1.72,-.413,.81),(.88,.04,.25),gold,.04)
    text('Edit reply label','EDIT REPLY',(1.39,-.44,.77),.09,ink)
    line('Shared job connection',[(.9,.02,1.8),(1.04,-.2,1.8)],blue)
else:
    box('Warehouse foundation',(0,0,.04),(4.8,3.8,.16),navy,.12)
    box('Warehouse floor',(0,0,.14),(4.58,3.58,.06),ink,.03)
    for x in [-1.6,1.45]:
        for y in [.35,1.12]:
            for height in [.65,1.35]: box('Rack shelf',(x,y,height),(1.05,.58,.08),navy,.018)
            for dx in [-.48,.48]: box('Rack upright',(x+dx,y, .85),(.07,.55,1.45),blue,.015)
            for height in [.87,1.55]: box('Stored cargo',(x,y,height),(.72,.42,.37),paper,.045)
    for y in [-1.25,-.75]: box('Dock pallet',(-1.7,y,.26),(.65,.42,.15),gold,.025)
    box('Robot chassis',(.12,-.6,.46),(.85,.7,.43),gold,.09)
    box('Robot roof',(.16,-.55,.88),(.61,.5,.08),navy,.035)
    for x in [-.12,.43]: box('Robot mast',(x,-.65,.74),(.055,.055,.4),blue,.013)
    for x in [-.2,.27]: box('Fork tine',(x,-1.2,.25),(.065,.6,.055),ice,.01)
    for x in [-.33,.57]:
        for y in [-.8,-.37]:
            bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.16, depth=.08, location=(x,y,.31), rotation=(0,math.pi/2,0))
            register(bpy.context.object,'Robot wheel',navy)
    line('Planned route',[(-1.55,-1.5,.2),(.4,-1.5,.2),(.8,-.8,.2),(.8,.65,.2)],blue,.027)
    for i in range(6):
        angle=math.radians(20+i*24)
        line('Conceptual sensor ray',[(.12,-.6,.95),(.12+1.0*math.cos(angle),-.6+1.0*math.sin(angle),.22)],ice,.009)
    box('Route destination',(.8,.65,.23),(.21,.21,.06),gold,.025)

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
target = Vector((0, 0, .75) if theme == 'robotics' else (-.06, .08, 1.92))
for name, location, energy, size, color in [('Soft key', (0,-6,8),900,6,(1,.95,.86)),('Blue rim',(4,3,6),1100,5,(.55,.76,1)),('Soft fill',(-5,-2,3),550,4,(.75,.85,1))]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.size, light.data.color = energy, size, color
    light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(6,-9,8) if theme == 'robotics' else (4.2,-11,5.4))
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
(SOURCE/'manifest.json').write_text(json.dumps({'blender':bpy.app.version_string,'camera':list(camera.location),'target':list(target),'orthographicScale':camera.data.ortho_scale,'resolution':[1600,1400],'triangles':triangles,'glbBytes':(PUBLIC/f'{theme}-hero.glb').stat().st_size,'illustration':'Original conceptual workflow illustration; synthetic records or simulated environment.'},indent=2)+'\n')
print(theme, 'exported:', triangles, 'triangles')
