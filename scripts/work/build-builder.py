"""Original Guided Business Builder hero. Run in Blender, including via MCP."""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/work/builder'
PUBLIC = ROOT / 'public/work/builder'
SOURCE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

# Preserve the user's other scenes in the open Blender session.
for previous in list(bpy.data.scenes):
    if previous.name.startswith('Quantum Digital — Guided Business Builder'):
        bpy.data.scenes.remove(previous)
scene = bpy.data.scenes.new('Quantum Digital — Guided Business Builder')
bpy.context.window.scene = scene
model = bpy.data.collections.new('Builder — editable conceptual workflow')
scene.collection.children.link(model)
bpy.context.preferences.filepaths.save_version = 0


def material(name, color, metallic=0, roughness=.4):
    rgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    linear = tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)
    mat = bpy.data.materials.new('Builder ' + name)
    mat.use_nodes = True
    mat.diffuse_color = (*linear, 1)
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*linear, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
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
        modifier.segments = 1 if bevel < .03 else 2
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def line(name, points, mat, radius=.018):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for vertex, coordinate in zip(spline.points, points):
        vertex.co = (*coordinate, 1)
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    curve.materials.append(mat)
    return obj


def disc(name, location, radius, mat, depth=.035):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24, radius=radius, depth=depth,
        location=location, rotation=(math.pi / 2, 0, 0),
    )
    return register(bpy.context.object, name, mat)


# A website as an assembled storefront: physical blocks rather than a UI replica.
box('Website frame', (.05, .18, 1.95), (3.05, .26, 2.72), navy, .13)
box('Website paper', (.05, .021, 1.84), (2.77, .07, 2.22), paper, .065)
for i in range(3):
    disc('Browser control ' + str(i), (-1.2 + i * .15, .025, 3.12), .035, gold if i == 0 else muted)
box('Browser address', (.28, .025, 3.12), (1.83, .03, .055), ink, .018)

# A gold and ice canopy makes the small-business subject immediately legible.
box('Canopy backing', (.05, -.16, 2.85), (2.92, .46, .16), navy, .04)
for i in range(8):
    x = -1.21 + i * .36
    slat = box('Storefront canopy stripe ' + str(i), (x, -.23, 2.89), (.355, .57, .10), gold if i % 2 == 0 else ice, .025)
    slat.rotation_euler.x = math.radians(12)
    box('Canopy valance ' + str(i), (x, -.51, 2.78), (.35, .09, .23), gold if i % 2 == 0 else ice, .035)

box('Website feature image', (-.65, -.04, 2.2), (.98, .06, .66), blue, .055)
disc('Feature sun', (-.41, -.08, 2.36), .10, gold)
box('Image foreground', (-.65, -.081, 2.03), (.86, .025, .14), ice, .025)
for i, width in enumerate([1.12, .92, .68]):
    box('Website heading line ' + str(i), (.56 - (1.12 - width) / 2, -.041, 2.42 - i * .15), (width, .025, .055 if i == 0 else .035), navy if i == 0 else muted, .01)
box('Website call to action', (.34, -.055, 1.93), (.68, .04, .19), gold, .04)
for i in range(3):
    x = -.86 + i * .91
    box('Service tile ' + str(i), (x, -.043, 1.35), (.73, .04, .63), ice, .045)
    box('Service tile marker ' + str(i), (x, -.079, 1.49), (.16, .026, .14), blue if i != 1 else gold, .025)
    for j, width in enumerate([.48, .34]):
        box('Service description', (x, -.077, 1.28 - j * .1), (width, .02, .03), muted, .007)
box('Website support', (.05, .20, .43), (.42, .40, .35), ink, .05)
box('Website foot', (.05, .11, .2), (1.85, .85, .12), navy, .055)

# Owner knowledge: two paper cards and a review token, connected to the website.
for i, (x, z) in enumerate([(-2.18, 2.42), (-2.02, 1.38)]):
    box('Owner fact card ' + str(i), (x, -.04, z), (1.02, .12, .78), paper, .065)
    box('Fact marker ' + str(i), (x - .3, -.116, z + .20), (.13, .025, .13), blue, .025)
    for j, width in enumerate([.66, .52, .39]):
        box('Business fact line', (x - (.66 - width) / 2, -.116, z + .02 - j * .13), (width, .02, .035), muted, .007)
    line('Knowledge connector ' + str(i), [(x + .52, .01, z), (-1.57, .01, z), (-1.57, .01, 1.92), (-1.49, .01, 1.92)], blue, .015)
disc('Owner approval token', (-1.81, -.21, .95), .25, gold, .09)
line('Owner approval check', [(-1.94, -.27, .95), (-1.85, -.27, .86), (-1.68, -.27, 1.06)], navy, .025)

# A conversation and an enquiry, grounded in the same approved knowledge.
box('Customer conversation', (2.09, -.37, 2.03), (1.30, .19, 1.08), navy, .11)
line('Conversation tail', [(1.69, -.37, 1.57), (1.60, -.37, 1.36), (1.99, -.37, 1.53)], navy, .07)
for i in range(3):
    disc('Assistant reply dot ' + str(i), (1.78 + i * .25, -.48, 2.12), .062, gold)
box('Assistant context line', (2.09, -.48, 1.85), (.80, .025, .04), muted, .01)
box('Reviewed enquiry card', (2.13, -.28, .84), (1.15, .13, .65), gold, .075)
for i, width in enumerate([.76, .53]):
    box('Enquiry detail', (2.13 - (.76 - width) / 2, -.36, .96 - i * .16), (width, .025, .04), navy, .01)
line('Website to assistant', [(1.60, .06, 2.12), (1.73, -.25, 2.12)], blue, .018)
line('Assistant to enquiry', [(2.56, -.25, 1.51), (2.56, -.25, 1.22), (2.13, -.25, 1.22), (2.13, -.25, 1.17)], blue, .015)

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
world = bpy.data.worlds.new('Builder neutral studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.15, .2, .3, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .45
scene.world = world
target = Vector((-.03, .05, 1.77))
for name, location, energy, size, color in [
    ('Soft key', (0, -6, 8), 900, 6, (1, .95, .86)),
    ('Blue rim', (4, 3, 6), 1100, 5, (.55, .76, 1)),
    ('Soft fill', (-5, -2, 3), 550, 4, (.75, .85, 1)),
]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = 'Builder ' + name
    light.data.energy, light.data.size, light.data.color = energy, size, color
    light.rotation_euler = (target - light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(location=(4.2, -11, 5.4))
camera = bpy.context.object
camera.name = 'Builder hero initial camera'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 7.1
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
scene.render.filepath = str(SOURCE / 'builder-hero.png')

# Leave Blender's viewport on the illustration, with the same camera as the site.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'builder-hero.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in list(model.objects):
    obj.select_set(True)
    if obj.type == 'CURVE':
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(
    filepath=str(PUBLIC / 'builder-hero.glb'), export_format='GLB',
    use_selection=True, export_apply=True, export_cameras=False, export_lights=False,
    export_texcoords=False,
)
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
(SOURCE / 'manifest.json').write_text(json.dumps({
    'blender': bpy.app.version_string,
    'camera': list(camera.location), 'target': list(target),
    'orthographicScale': camera.data.ortho_scale,
    'resolution': [1600, 1400], 'triangles': triangles,
    'glbBytes': (PUBLIC / 'builder-hero.glb').stat().st_size,
    'illustration': 'Original conceptual storefront, approved knowledge, conversation, and enquiry. No product screenshot.',
}, indent=2) + '\n')
print('Builder exported:', triangles, 'triangles')
