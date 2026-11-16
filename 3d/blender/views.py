import bpy, sys, math, mathutils
src=open('pose.py').read().split("pb = arm.pose.bones")[0]
src=src.replace("arm = next(o for o in sc.objects if o.type == 'ARMATURE')","arm = next((o for o in sc.objects if o.type == 'ARMATURE'), None)")
src=src.replace("for name, ang in [('front', 0), ('side', 90)]:","for name, ang in [('front', 0), ('q', 40), ('side', 90), ('back', 180)]:")
exec(src); shoot('v')
