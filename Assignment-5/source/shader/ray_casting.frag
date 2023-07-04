#version 150
#extension GL_ARB_explicit_attrib_location : require

#define TASK 0
#define ENABLE_LIGHTING 0
#define ENABLE_BINARY_SEARCH 0
#define USE_GRADIENT_VOLUME 0

// ---------------------------------------------------------------------------------
// input 'varyings': can be different for each fragment 
// ---------------------------------------------------------------------------------

// this variable holds the 3d position where the ray enters the cube that 'contains' the volume data 
in vec3 ray_entry_position;


// ---------------------------------------------------------------------------------
// input 'uniforms': same for all fragments, but may change between render passes (frames) 
// ---------------------------------------------------------------------------------


// texture handles
// textures are chunks of data, such as the volume data, that we access through these handles
uniform sampler3D volume_texture;
uniform sampler2D transfer_func_texture;
uniform sampler3D gradient_volume_texture;

uniform vec3    camera_location;
uniform vec3    max_bounds; //the max corner of the axis-aligned bounding box (AABB) containing the volume data. Min corner = (0,0,0).

// iso-surface ray-casting settings, controlled by the graphical user interface (GUI)
uniform float   sampling_distance; // distance between samples
uniform float   iso_value; // value for which an iso-surface should be shown in iso-surface ray-casting mode

// lighting settings
uniform vec3    light_position;
uniform vec3    light_ambient_color;
uniform vec3    light_diffuse_color;
uniform vec3    light_specular_color;
uniform float   light_shininess;

// ---------------------------------------------------------------------------------
// constants: same for all fragments, for all render passes (frames) 
// ---------------------------------------------------------------------------------

const float light_ambient_reflection_constant = 0.4f;
const float light_diffuse_reflection_constant = 0.8f;
const float light_specular_reflection_constant = 0.8f;

// ---------------------------------------------------------------------------------
// outputs for each fragment
// ---------------------------------------------------------------------------------

layout(location = 0) out vec4 FragColor;

// ---------------------------------------------------------------------------------
// functions 
// ---------------------------------------------------------------------------------


// INPUT: sampling position
// OUTPUT: true if given position is inside the volume, false otherwise
bool inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}


// INPUT: sampling position
// OUTPUT: the trilinearly-interpolated data value from the volume at the given position
float sample_data_volume(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(volume_texture, in_sampling_pos * obj_to_tex).r;
}

// INPUT: data value, range [0,1]
// OUTPUT: color (3 elements, RGB) and opacity (1 element) for given value from the transfer function
vec4 get_color_and_opacity_for_data_value_from_transfer_function(float data_value)
{
    return texture(transfer_func_texture, vec2(data_value, 0.f));
}



// INPUT: sampling position
// OUTPUT: the gradient of the volume at the given sample position
vec3 calculate_gradient(vec3 in_sampling_pos)
{
// If 'Use pre-calculated gradients' is selected, the gradient will be sampled from a pre-calculated gradient volume
// This function is for debugging purposes, and checking your implementation of task 3
#if USE_GRADIENT_VOLUME
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(gradient_volume_texture, in_sampling_pos * obj_to_tex).xyz;
#else
    // TASK 3: calculate the gradient (by sampling the data volume) using the central differences method
    // Size of the volume dataset
    const vec3 datasetSize = vec3(256.0, 256.0, 225.0);

    // Step size (size of a voxel)
    const vec3 stepSize = 1.0 / datasetSize;

    // Calculate the gradient in each direction
    vec3 gradient;
    float x_forward = sample_data_volume(in_sampling_pos + vec3(stepSize.x, 0.0f, 0.0f));
    float x_backward = sample_data_volume(in_sampling_pos - vec3(stepSize.x, 0.0f, 0.0f));
    float x_central_diff = (x_forward - x_backward) / 2.0f * stepSize.x;

    float y_forward = sample_data_volume(in_sampling_pos + vec3(0.0f, stepSize.y, 0.0f));
    float y_backward = sample_data_volume(in_sampling_pos - vec3(0.0f, stepSize.y, 0.0f));
    float y_central_diff = (y_forward - y_backward) / 2.0f * stepSize.y;

    float z_forward = sample_data_volume(in_sampling_pos + vec3(0.0f, 0.0f, stepSize.z));
    float z_backward = sample_data_volume(in_sampling_pos - vec3(0.0f, 0.0f, stepSize.z));
    float z_central_diff = (z_forward - z_backward) / 2.0f * stepSize.z;

    gradient = vec3(x_central_diff, y_central_diff, z_central_diff);
    return gradient;

#endif
}


// INPUT: sampling position and surface normal at the sampling position
// OUTPUT: the lighting component for the given sample point
vec3 calculate_illumination(vec3 in_sampling_pos, vec3 surface_normal, vec3 ray_direction) {

    // avoid divide by 0 during normalization
    if (length(surface_normal) == 0.f){
        return vec3(0.f);
    }

    vec3 normal = normalize(surface_normal);

    vec3 pnt_to_light = normalize(light_position - in_sampling_pos);
    float lambertian = max(dot(pnt_to_light,normal),0.0);

    vec3 pnt_to_cam = normalize(camera_location - in_sampling_pos);
    vec3 R = reflect(-pnt_to_light, normal);

    float spec = max(dot(R, -normalize(ray_direction) ), 0);
    float specular = pow(spec, light_shininess);

    vec3 shade_col = light_ambient_reflection_constant * light_ambient_color
                + light_diffuse_reflection_constant * light_diffuse_color * lambertian
                + light_specular_reflection_constant * light_specular_color * specular
                ;

    return shade_col;
}


const float binary_search_epsilon = 0.00001;

// INPUT: two points (on a ray), between which an iso-surface intersection lies
// OUTPUT: a point, somewhere on the line connecting the 2 given points, that is a more accurate estimation of where the intersection lies
vec3 binary_search_for_isosurface_intersection(vec3 lower_pos, vec3 upper_pos) {

    vec3 midpoint;

    for (int i = 0; i < 5; ++i)
    {
        midpoint = (lower_pos + upper_pos) / 2.f;
        float midpoint_sample_val = sample_data_volume(midpoint);

        if (abs(midpoint_sample_val - iso_value) < binary_search_epsilon) {
            break;
        }
        else if ((midpoint_sample_val - iso_value) < 0) {
            lower_pos = midpoint;
        }
        else if ((midpoint_sample_val - iso_value) > 0) {
            upper_pos = midpoint;
        }
    }
    return midpoint;
}

// ---------------------------------------------------------------------------------
// main function
// ---------------------------------------------------------------------------------


void main()
{
    // Each ray is represented by one execution of this shader program
    // In this sense, each ray's journey starts here, at the start of the main function

    // first, we calculate the direction of the ray 
    // the ray travels directly from the camera location to the point at which it intersects the cube (ray_entry_position)
    vec3 ray_direction = normalize(ray_entry_position - camera_location);

    // A ray's traversal is represented by repeatedly updating a sampling position
    // at each step, the sampling position is moved along the ray ("incremented") by a fixed distance
    // Here, we precalculate the increment, using the ray direction and sampling distance (distance between samples)
    vec3 ray_increment = ray_direction * sampling_distance;

    // we calculate the first sampling point from the ray_entry_position
    // to make sure that we are definitely inside the volume at the first step, we move along the ray direction by the ray increment
    vec3 sampling_pos  = ray_entry_position;
    sampling_pos += ray_increment;

    // Now we define a variable which will hold the final colour that the ray produces
    vec4 out_col = vec4(0.0, 0.0, 0.0, 0.0);

#if TASK == 0 
    // example - average intensity projection (X-ray)
    // In the average intensity projection method, each ray calculates the mean intensity value that it encounters while traversing the volume.

    // to calculate an average, we need to store the sum of the intensity, and the number of values encountered.
    // here, we define variables for those
    vec4  sum_intensity = vec4(0.f);
    int   num_samples = 0;

    // now we start a while loop representing the ray's traversal of the volume.
    // in each iteration of the loop, we update the sampling position, adding a small shift in line with the direction of the ray.
    // the loop terminates when the sampling position is outside the volume boundary, which we check with the 'inside_volume_bounds' function
    while (inside_volume_bounds(sampling_pos)) 
    {      
        // to determine the intensity at the current point p, we first need to retrieve a data value from the volume at p.
        // this is made possible by a 'sample_data_volume' function, which takes the current position, 
        // samples a value from 3D texture holding the volume data, and returns that value as a float in range [0,1].
        float data_value = sample_data_volume(sampling_pos);

        // now we can determine intensity at p.
        // For this example, we can convert the data value to an intensity with a grey level proportional to the data value.
        // We can leave the opacity channel with value 1 (opaque).
        vec4 intensity = vec4(data_value, data_value, data_value, 1.f);

        // To calculate the average value, we need to accumulate the intensity for all iterations of the loop:
        sum_intensity += intensity;

        // ...and count the number of samples we take:
        ++num_samples;

        // Finally, to continue along the traversal path of the ray, we update the sampling position
        sampling_pos  += ray_increment;
    }

    // After traversal is done, we need to calculate the mean intensity.
    // To avoid dividing by zero, we check if any samples were taken (i.e. num_samples > 0) before calculating the final intensity value.
    // The final intensity is assigned to the output colour variable.
    if (num_samples > 0.f){
        out_col = sum_intensity / num_samples;
    } else {
        out_col = vec4(0.f);
    }

#endif

   
#if TASK == 1 
    // TASK 1 - maximum intensity projection
    float max_found_value = 0.0f;

    while(inside_volume_bounds(sampling_pos)) {
        float found_value = sample_data_volume(sampling_pos);
        max_found_value = max(found_value, max_found_value);
        sampling_pos += ray_increment;
    }
    out_col = vec4(max_found_value, max_found_value, max_found_value, 1.0f);


    #endif

#if TASK == 2 
    // TASK 2: first-hit iso-surface raycasting
    float last_sampled_value = 0.0f;

    while(inside_volume_bounds(sampling_pos)) {
        float current_value = sample_data_volume(sampling_pos);

        if (last_sampled_value < iso_value && iso_value < current_value) {
            out_col = vec4(0.55f, 0.6f, 0.68f, 1.0f);
            // Code snippet for TASK 3 - should be executed only when an iso-surface intersection is found
            #if ENABLE_BINARY_SEARCH
                vec3 at_position = binary_search_for_isosurface_intersection(sampling_pos - ray_increment, sampling_pos);
            #else
                vec3 at_position = sampling_pos;
            #endif
            #if ENABLE_LIGHTING
                vec3 gradient = calculate_gradient(at_position);
                vec3 lighting = calculate_illumination(at_position, -gradient, ray_direction);
                out_col *= vec4(lighting, 1.0);
            #endif
            break;
        } else {
            last_sampled_value = current_value;
        }
        sampling_pos += ray_increment;
    }
#endif




#if TASK == 5 
    // front-to-back compostiting
    float termination_epsilon = 0.5;
    vec3 accumulated_intensity;
    float accumulated_opacity;
    while (inside_volume_bounds(sampling_pos)) {
        float current_data_point = sample_data_volume(sampling_pos);
        vec4 rgba = get_color_and_opacity_for_data_value_from_transfer_function(current_data_point);
        vec3 current_intensity = rgba.xyz * rgba.w;
        accumulated_intensity += (1 - accumulated_opacity) * current_intensity;
        accumulated_opacity = 1 - (1 - accumulated_opacity) * (1 - rgba.w);
        if (abs(accumulated_opacity - 1.0f) < termination_epsilon) {
            break;
        }
        sampling_pos += ray_increment;
    }
    out_col = vec4(accumulated_intensity, accumulated_opacity);
#endif

    


    // assign the calculated color value as the output colour of this fragment
    FragColor = out_col;
}

