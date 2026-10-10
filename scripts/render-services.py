"""Rebuild the original conceptual service illustrations with Blender.
Run: blender --background --python scripts/render-services.py
These are illustrations of service themes, not completed client products.
"""
import math
from pathlib import Path
import bpy
from mathutils import Vector

OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'services'
OUTPUT.mkdir(parents=True, exist_ok=True)

def material(name, color, metallic=0, emission=0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.use_nodes = True
    node = result.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = 0.3
    node.inputs['Emission Color'].default_value = (*color, 1)
    node.inputs['Emission Strength'].default_value = emission
    return result

def cube(name, location, scale, surface, bevel=0.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(surface)
    modifier = obj.modifiers.new('Soft machined edges', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 4
    obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj

def sphere(location, radius, surface):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius, location=location)
    obj = bpy.context.object
    obj.data.materials.append(surface)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj

def connection(start, end, surface, radius=0.018):
    start, end = Vector(start), Vector(end)
    delta = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=radius, depth=delta.length, location=(start + end) / 2)
    obj = bpy.context.object
    obj.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    obj.data.materials.append(surface)
    return obj

for theme in ['product', 'ai', 'workflow', 'integration']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 880
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 85
    scene.view_settings.view_transform = 'AgX'
    world = bpy.data.worlds.new('Navy studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.008, 0.019, 0.04, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 0.4
    scene.world = world
    navy = material('Deep blue alloy', (0.018, 0.06, 0.13), 0.65)
    blue = material('Blue accent', (0.01, 0.3, 0.75), 0.5)
    ice = material('Ice alloy', (0.28, 0.65, 0.85), 0.7)
    signal = material('Luminous cyan', (0.0, 0.45, 0.8), 0.15, 2)
    ground = material('Navy floor', (0.004, 0.012, 0.025), 0.1)
    cube('Studio floor', (0, 0, -0.45), (200, 200, 0.1), ground, 0)
    if theme == 'product':
        for i in range(3):
            cube('Product layer', (0, 0, i * 0.32), (2.6, 1.85, 0.13), navy)
            cube('Layer edge', (0, -0.92, i * 0.32 + 0.045), (2.25, 0.025, 0.02), signal, 0.008)
        cube('Interface panel', (0, 0, 0.78), (2.38, 1.63, 0.08), blue)
        for i in range(3):
            cube('Interface tile', (-0.72 + i * 0.72, 0.12, 0.85), (0.58, 0.85, 0.06), ice if i == 1 else navy, 0.04)
        cube('Interface rail', (0, -0.54, 0.85), (1.98, 0.14, 0.06), navy, 0.025)
    elif theme == 'ai':
        sphere((0, 0, 0.65), 0.46, ice)
        for i in range(8):
            angle = i * math.tau / 8
            point = (1.48 * math.cos(angle), 1.48 * math.sin(angle), 0.35 + (i % 2) * 0.55)
            sphere(point, 0.11, signal)
            connection((0, 0, 0.65), point, blue, 0.025)
            next_angle = (i + 1) * math.tau / 8
            connection(point, (1.48 * math.cos(next_angle), 1.48 * math.sin(next_angle), 0.35 + ((i + 1) % 2) * 0.55), navy, 0.018)
        cube('Core foundation', (0, 0, -0.18), (1.2, 1.2, 0.22), navy)
    elif theme == 'workflow':
        for i in range(3):
            x = (i - 1) * 1.4
            cube('Workflow step', (x, 0, 0.1 + i * 0.2), (0.95, 1.0, 0.35), navy)
            cube('Step signal', (x, 0, 0.3 + i * 0.2), (0.7, 0.7, 0.06), blue)
            sphere((x, 0, 0.42 + i * 0.2), 0.095, signal)
            if i < 2:
                connection((x + 0.5, 0, 0.25 + i * 0.2), (x + 0.9, 0, 0.45 + i * 0.2), signal, 0.025)
        connection((-1.4, 0.6, 0.25), (1.4, 0.6, 0.65), blue, 0.025)
    else:
        for x, y in [(-1.05, -0.1), (1.05, 0.1)]:
            cube('Connected system', (x, y, 0.35), (1.15, 1.15, 1.15), navy)
            cube('System face', (x, y - 0.58, 0.35), (0.88, 0.03, 0.88), blue, 0.04)
            cube('System indicator', (x, y - 0.61, 0.35), (0.45, 0.025, 0.04), signal, 0.015)
        connection((-0.45, 0, 0.4), (0.45, 0, 0.4), signal, 0.03)
        sphere((0, 0, 0.4), 0.1, ice)
    for location, energy, color, size in [((1, -4, 7), 1100, (0.6, 0.82, 1), 5), ((-4, 1, 4), 950, (0.1, 0.4, 1), 4), ((3, 4, 5), 1400, (0.4, 0.8, 1), 3)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        obj = bpy.context.object
        obj.data.energy = energy
        obj.data.color = color
        obj.data.shape = 'DISK'
        obj.data.size = size
        obj.rotation_euler = (Vector((0, 0, 0.3)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add(location=(4, -7, 5))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, 0.45)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 5.8
    scene.camera = camera
    scene.render.filepath = str(OUTPUT / f'{theme}.jpg')
    bpy.ops.render.render(write_still=True)
